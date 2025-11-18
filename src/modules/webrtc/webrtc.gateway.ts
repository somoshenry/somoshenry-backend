import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebRTCService } from './webrtc.service';
import { RoomChatService } from './room-chat.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { WebRTCSignalDto } from './dto/webrtc-signal.dto';
import { IceCandidateDto } from './dto/ice-candidate.dto';
import { UserService } from '../user/user.service';

interface JwtPayload {
  sub?: string;
  id?: string;
}

interface UserSocketData {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/webrtc',
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(WebRTCGateway.name);
  private readonly socketToRoom = new Map<string, string>();
  private readonly socketToUser = new Map<string, string>();

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly roomChatService: RoomChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  // AUTENTICACIÓN SOCKET
  async handleConnection(client: Socket): Promise<void> {
    let token: string | undefined =
      (client.handshake.auth?.token as string) || undefined;

    if (!token) {
      this.logger.warn('token no llegó — retry 200ms...');
      await new Promise((r) => setTimeout(r, 200));
      token = (client.handshake.auth?.token as string) || undefined;
    }

    if (!token) {
      this.logger.error('Sin token después del retry → disconnect');
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub ?? payload.id;

      if (!userId) throw new UnauthorizedException();

      (client.data as UserSocketData).userId = userId;
      this.socketToUser.set(client.id, userId);

      this.logger.log(`WebRTC conectado → user ${userId}, socket ${client.id}`);

      client.emit('connected', { userId });
    } catch (err) {
      this.logger.error('Error autenticando socket', err);
      client.disconnect();
    }
  }

  // DESCONEXIÓN
  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.socketToUser.get(client.id);
    const roomId = this.socketToRoom.get(client.id);

    if (roomId && userId) {
      try {
        await this.webrtcService.removeParticipant(roomId, userId);

        this.server.to(roomId).emit('userLeft', { userId, roomId });
        void client.leave(roomId);
      } catch (error) {
        this.logger.error('Error al eliminar participante', error);
      }
    }

    this.socketToUser.delete(client.id);
    this.socketToRoom.delete(client.id);

    this.logger.log(`🔴 Usuario ${userId} desconectado`);
  }

  // 🟢 JOIN ROOM (datos completos para el front)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;

    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    try {
      // Validar que la sala exista (se crea por HTTP en el controller)
      await this.webrtcService.getRoom(dto.roomId);

      // 1) Agregar participante a la sala
      const participant = await this.webrtcService.addParticipant(
        dto.roomId,
        userId,
        client.id,
        dto.audio ?? true,
        dto.video ?? true,
      );

      await client.join(dto.roomId);
      this.socketToRoom.set(client.id, dto.roomId);

      // 2) Datos del usuario desde DB
      const user = await this.userService.findById(userId);

      const fullName = `${user.name ?? ''} ${user.lastName ?? ''}`.trim();
      const avatar = user.profilePicture ?? null;
      const username = user.username ?? user.email ?? (fullName || 'Usuario');

      const currentUser = {
        userId: user.id,
        name: user.name ?? null,
        lastName: user.lastName ?? null,
        username,
        avatar,
      };

      // 3) Participantes actuales con nombres / username / avatar
      const participants = await this.webrtcService.getParticipants(dto.roomId);

      const participantsWithNames = await Promise.all(
        participants.map(async (p) => {
          const u = await this.userService.findById(p.userId);
          const full = `${u.name ?? ''} ${u.lastName ?? ''}`.trim();
          const uUsername = u.username ?? u.email ?? (full || 'Usuario');

          return {
            userId: u.id,
            name: u.name ?? null,
            lastName: u.lastName ?? null,
            username: uUsername,
            avatar: u.profilePicture ?? null,
            audio: p.audio,
            video: p.video,
            screen: p.screen,
          };
        }),
      );

      // 4) Emitir "joinedRoom" al que entra
      client.emit('joinedRoom', {
        roomId: dto.roomId,
        user: currentUser,
        participants: participantsWithNames,
      });

      // 5) Emitir "userJoined" al resto
      client.to(dto.roomId).emit('userJoined', {
        userId: user.id,
        name: user.name ?? null,
        lastName: user.lastName ?? null,
        username,
        avatar,
        audio: participant.audio,
        video: participant.video,
        screen: participant.screen,
      });

      this.logger.log(`🎥 Usuario ${userId} se unió a room ${dto.roomId}`);
    } catch (error) {
      this.logger.error('Error al unirse a room', error);
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Error al unirse a la sala',
      });
    }
  }

  // 👋 LEAVE ROOM
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;
    const roomId = payload?.roomId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (!roomId) {
      throw new BadRequestException('roomId es requerido');
    }

    try {
      // Validar que la sala existe
      await this.webrtcService.getRoom(roomId);

      // Remover participante de la sala
      await this.webrtcService.removeParticipant(roomId, userId);

      // Notificar al resto de participantes que el usuario se fue
      this.server.to(roomId).emit('userLeft', { userId, roomId });

      // Remover el cliente del socket.io room
      await client.leave(roomId);

      // Actualizar mapeos internos
      this.socketToRoom.delete(client.id);

      // Confirmar al cliente que salió exitosamente
      client.emit('leftRoom', { roomId, success: true });

      this.logger.log(`👋 Usuario ${userId} salió de room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error al salir de room ${roomId}:`, error);
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Error al salir de la sala',
      });
    }
  }

  // 📡 SIGNALING (OFFER / ANSWER / ICE)
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WebRTCSignalDto,
  ): void {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    const targetSocket = this.getUserSocket(dto.targetUserId);

    if (targetSocket) {
      this.server.to(targetSocket).emit('offer', {
        fromUserId: userId,
        sdp: dto.sdp as RTCSessionDescriptionInit,
        roomId: dto.roomId,
      });
      this.logger.log(`📤 Offer: ${userId} -> ${dto.targetUserId}`);
    } else {
      client.emit('error', { message: 'Usuario objetivo no conectado' });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WebRTCSignalDto,
  ): void {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    const targetSocket = this.getUserSocket(dto.targetUserId);

    if (targetSocket) {
      this.server.to(targetSocket).emit('answer', {
        fromUserId: userId,
        sdp: dto.sdp as RTCSessionDescriptionInit,
        roomId: dto.roomId,
      });
      this.logger.log(`📥 Answer: ${userId} -> ${dto.targetUserId}`);
    } else {
      client.emit('error', { message: 'Usuario objetivo no conectado' });
    }
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IceCandidateDto,
  ): void {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    const targetSocket = this.getUserSocket(dto.targetUserId);

    if (targetSocket) {
      this.server.to(targetSocket).emit('iceCandidate', {
        fromUserId: userId,
        candidate: dto.candidate as RTCIceCandidateInit,
        roomId: dto.roomId,
      });
      this.logger.log(`🧊 ICE: ${userId} -> ${dto.targetUserId}`);
    }
  }

  // 🎛 MEDIA CONTROLS
  @SubscribeMessage('toggleAudio')
  async handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; enabled: boolean },
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    try {
      await this.webrtcService.updateParticipantMedia(
        payload.roomId,
        userId,
        payload.enabled,
      );

      this.server
        .to(payload.roomId)
        .emit('userMediaChanged', { userId, audio: payload.enabled });
    } catch (e) {
      this.logger.error('Error al cambiar audio', e);
    }
  }

  @SubscribeMessage('toggleVideo')
  async handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; enabled: boolean },
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    try {
      await this.webrtcService.updateParticipantMedia(
        payload.roomId,
        userId,
        undefined,
        payload.enabled,
      );

      this.server
        .to(payload.roomId)
        .emit('userMediaChanged', { userId, video: payload.enabled });
    } catch (e) {
      this.logger.error('Error al cambiar video', e);
    }
  }

  @SubscribeMessage('toggleScreenShare')
  async handleToggleScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; enabled: boolean },
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    try {
      await this.webrtcService.updateParticipantMedia(
        payload.roomId,
        userId,
        undefined,
        undefined,
        payload.enabled,
      );

      this.server
        .to(payload.roomId)
        .emit('userMediaChanged', { userId, screen: payload.enabled });
    } catch (e) {
      this.logger.error('Error al cambiar screen share', e);
    }
  }

  // 💬 CHAT
  @SubscribeMessage('joinChatRoom')
  async handleJoinChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    // Cargar mensajes previos de MongoDB
    try {
      const previousMessages = await this.roomChatService.getMessages(
        payload.roomId,
        50,
      );
      client.emit('previousMessages', previousMessages);
      this.logger.log(
        `💬 ${userId} joined chat in room ${payload.roomId}, loaded ${previousMessages.length} messages`,
      );
    } catch (error) {
      this.logger.error('Error loading previous messages', error);
    }
  }

  @SubscribeMessage('sendChatMessage')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      message: string;
      userName: string;
      userAvatar?: string;
    },
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId as string;
    if (!userId) throw new UnauthorizedException();

    if (!payload.message?.trim()) {
      client.emit('error', { message: 'Mensaje vacío' });
      return;
    }

    try {
      // Verificar que el usuario esté en la sala
      const participants = await this.webrtcService.getParticipants(
        payload.roomId,
      );
      const isInRoom = participants.some((p) => p.userId === userId);

      if (!isInRoom) {
        throw new BadRequestException('No estás en esta sala');
      }

      // Guardar en MongoDB
      const chatMessage = await this.roomChatService.saveMessage({
        roomId: payload.roomId,
        userId,
        userName: payload.userName,
        userAvatar: payload.userAvatar || undefined,
        message: payload.message,
      });

      // Emitir a todos en la sala (incluyendo al remitente)
      this.server.to(payload.roomId).emit('chatMessage', chatMessage);

      this.logger.log(
        `💬 Mensaje en ${payload.roomId} de ${payload.userName}: ${payload.message.substring(0, 50)}...`,
      );
    } catch (error) {
      this.logger.error('Error al enviar mensaje de chat', error);
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Error al enviar mensaje',
      });
    }
  }

  private getUserSocket(userId: string): string | undefined {
    for (const [socketId, uid] of this.socketToUser.entries()) {
      if (uid === userId) return socketId;
    }
    return undefined;
  }
}
