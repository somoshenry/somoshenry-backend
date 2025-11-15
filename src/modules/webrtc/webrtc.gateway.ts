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
  UseGuards,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebRTCService } from './webrtc.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { WebRTCSignalDto } from './dto/webrtc-signal.dto';
import { IceCandidateDto } from './dto/ice-candidate.dto';

interface JwtPayload {
  sub?: string;
  id?: string;
}

interface UserSocketData {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/webrtc', // Namespace separado para WebRTC
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(WebRTCGateway.name);
  private readonly socketToRoom = new Map<string, string>(); // socketId -> roomId
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly jwtService: JwtService,
  ) {}

  // --------------------------
  // CONEXIÓN / DESCONEXIÓN
  // --------------------------

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token;

    if (!token) {
      this.logger.warn('❌ Conexión rechazada: sin token');
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub ?? payload.id;

      if (!userId) {
        throw new UnauthorizedException('Token inválido');
      }

      const data = client.data as UserSocketData;
      data.userId = userId;
      client.data.userId = userId;

      this.socketToUser.set(client.id, userId);

      this.logger.log(
        `✅ WebRTC: Usuario ${userId} conectado (socket: ${client.id})`,
      );

      client.emit('connected', { userId });
    } catch (err) {
      this.logger.error('❌ Error al autenticar WebRTC socket', err);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = this.socketToUser.get(client.id);
    const roomId = this.socketToRoom.get(client.id);

    if (roomId && userId) {
      try {
        await this.webrtcService.removeParticipant(roomId, userId);

        // Notificar a todos en la sala que este usuario se fue
        this.server.to(roomId).emit('userLeft', {
          userId,
          roomId,
        });

        client.leave(roomId);
      } catch (error) {
        this.logger.error(
          'Error al eliminar participante en desconexión',
          error,
        );
      }
    }

    this.socketToUser.delete(client.id);
    this.socketToRoom.delete(client.id);

    this.logger.log(`🔴 WebRTC: Usuario desconectado (socket: ${client.id})`);
  }

  // --------------------------
  // MANEJO DE ROOMS
  // --------------------------

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      // Agregar participante a la room
      const participant = await this.webrtcService.addParticipant(
        dto.roomId,
        userId,
        client.id,
        dto.audio ?? true,
        dto.video ?? true,
      );

      // Unirse a la sala de Socket.IO
      await client.join(dto.roomId);
      this.socketToRoom.set(client.id, dto.roomId);

      // Obtener lista de participantes actuales
      const participants = await this.webrtcService.getParticipants(dto.roomId);

      // Notificar al usuario que se unió exitosamente
      client.emit('joinedRoom', {
        roomId: dto.roomId,
        userId,
        participants: participants.map((p) => ({
          userId: p.userId,
          audio: p.audio,
          video: p.video,
          screen: p.screen,
        })),
      });

      // Notificar a otros usuarios que alguien se unió
      client.to(dto.roomId).emit('userJoined', {
        userId,
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

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId || !roomId) {
      throw new BadRequestException('Datos inválidos');
    }

    try {
      await this.webrtcService.removeParticipant(roomId, userId);

      // Notificar a otros que el usuario se fue
      this.server.to(roomId).emit('userLeft', { userId, roomId });

      await client.leave(roomId);
      this.socketToRoom.delete(client.id);

      client.emit('leftRoom', { roomId });

      this.logger.log(`👋 Usuario ${userId} salió de room ${roomId}`);
    } catch (error) {
      this.logger.error('Error al salir de room', error);
    }
  }

  // --------------------------
  // SEÑALIZACIÓN WEBRTC
  // --------------------------

  @SubscribeMessage('offer')
  async handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WebRTCSignalDto,
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Enviar la oferta al usuario objetivo
    const targetSocket = this.getUserSocket(dto.targetUserId);

    if (targetSocket) {
      this.server.to(targetSocket).emit('offer', {
        fromUserId: userId,
        sdp: dto.sdp,
        roomId: dto.roomId,
      });

      this.logger.log(`📤 Offer: ${userId} -> ${dto.targetUserId}`);
    } else {
      client.emit('error', { message: 'Usuario objetivo no conectado' });
    }
  }

  @SubscribeMessage('answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WebRTCSignalDto,
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Enviar la respuesta al usuario objetivo
    const targetSocket = this.getUserSocket(dto.targetUserId);

    if (targetSocket) {
      this.server.to(targetSocket).emit('answer', {
        fromUserId: userId,
        sdp: dto.sdp,
        roomId: dto.roomId,
      });

      this.logger.log(`📥 Answer: ${userId} -> ${dto.targetUserId}`);
    } else {
      client.emit('error', { message: 'Usuario objetivo no conectado' });
    }
  }

  @SubscribeMessage('iceCandidate')
  async handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IceCandidateDto,
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Enviar el ICE candidate al usuario objetivo
    const targetSocket = this.getUserSocket(dto.targetUserId);

    if (targetSocket) {
      this.server.to(targetSocket).emit('iceCandidate', {
        fromUserId: userId,
        candidate: dto.candidate,
        roomId: dto.roomId,
      });

      this.logger.log(`🧊 ICE: ${userId} -> ${dto.targetUserId}`);
    }
  }

  // --------------------------
  // CONTROL DE MEDIA
  // --------------------------

  @SubscribeMessage('toggleAudio')
  async handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; enabled: boolean },
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      await this.webrtcService.updateParticipantMedia(
        payload.roomId,
        userId,
        payload.enabled,
        undefined,
        undefined,
      );

      // Notificar a todos en la sala
      this.server.to(payload.roomId).emit('userMediaChanged', {
        userId,
        audio: payload.enabled,
      });

      this.logger.log(`🎤 Audio ${payload.enabled ? 'ON' : 'OFF'}: ${userId}`);
    } catch (error) {
      this.logger.error('Error al cambiar audio', error);
    }
  }

  @SubscribeMessage('toggleVideo')
  async handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; enabled: boolean },
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      await this.webrtcService.updateParticipantMedia(
        payload.roomId,
        userId,
        undefined,
        payload.enabled,
        undefined,
      );

      // Notificar a todos en la sala
      this.server.to(payload.roomId).emit('userMediaChanged', {
        userId,
        video: payload.enabled,
      });

      this.logger.log(`📹 Video ${payload.enabled ? 'ON' : 'OFF'}: ${userId}`);
    } catch (error) {
      this.logger.error('Error al cambiar video', error);
    }
  }

  @SubscribeMessage('toggleScreenShare')
  async handleToggleScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; enabled: boolean },
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      await this.webrtcService.updateParticipantMedia(
        payload.roomId,
        userId,
        undefined,
        undefined,
        payload.enabled,
      );

      // Notificar a todos en la sala
      this.server.to(payload.roomId).emit('userMediaChanged', {
        userId,
        screen: payload.enabled,
      });

      this.logger.log(`🖥️ Screen ${payload.enabled ? 'ON' : 'OFF'}: ${userId}`);
    } catch (error) {
      this.logger.error('Error al cambiar screen share', error);
    }
  }

  // --------------------------
  // HELPERS
  // --------------------------

  private getUserSocket(userId: string): string | undefined {
    for (const [socketId, uid] of this.socketToUser.entries()) {
      if (uid === userId) {
        return socketId;
      }
    }
    return undefined;
  }
}
