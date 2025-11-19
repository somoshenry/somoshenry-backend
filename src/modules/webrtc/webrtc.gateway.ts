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
  NotFoundException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebRTCService } from './webrtc.service';
import { RoomChatService } from './room-chat.service';
import { IceServerManagerService } from './services/ice-server-manager.service';
import { SignalingStateMachineService } from './services/signaling-state-machine.service';
import { PeerConnectionTrackerService } from './services/peer-connection-tracker.service';
import { IceCandidateBufferService } from './services/ice-candidate-buffer.service';
import { RateLimitService } from '../../common/services/rate-limit.service';
import { RateLimitExceededException } from '../../common/exceptions/redis.exceptions';
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
  pingTimeout: 60000,
  pingInterval: 25000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxHttpBufferSize: 1e6,
  transports: ['websocket', 'polling'],
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(WebRTCGateway.name);
  private readonly socketToRoom = new Map<string, string>();
  private readonly socketToUser = new Map<string, string>();
  private readonly userToSocket = new Map<string, string>();

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly roomChatService: RoomChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly iceServerManager: IceServerManagerService,
    private readonly signalingStateMachine: SignalingStateMachineService,
    private readonly peerConnectionTracker: PeerConnectionTrackerService,
    private readonly iceCandidateBuffer: IceCandidateBufferService,
    private readonly rateLimitService: RateLimitService,
  ) {
    setInterval(() => this.rateLimitService.cleanupExpiredWindows(), 60000);
  }

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
      this.userToSocket.set(userId, client.id);

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
        // Cleanup state machine and tracker for this user in this room
        this.peerConnectionTracker.cleanupStaleConnections();
        this.iceCandidateBuffer.cleanupStaleBuffers();

        await this.webrtcService.removeParticipant(roomId, userId);

        this.server.to(roomId).emit('userLeft', { userId, roomId });
        void client.leave(roomId);
      } catch (error) {
        this.logger.error('Error al eliminar participante', error);
      }
    }

    if (userId) {
      this.userToSocket.delete(userId);
    }
    this.socketToUser.delete(client.id);
    this.socketToRoom.delete(client.id);

    this.logger.log(`Usuario ${userId} desconectado`);
  }

  // JOIN ROOM (datos completos para el front)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ): Promise<void> {
    const userId = (client.data as UserSocketData).userId;

    if (!userId) {
      this.logger.error('joinRoom: Usuario no autenticado');
      client.emit('error', {
        code: 'UNAUTHORIZED',
        message: 'Usuario no autenticado',
      });
      return;
    }

    try {
      this.rateLimitService.checkLimit(userId, 50);
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        client.emit('error', {
          code: 'RATE_LIMITED',
          message: 'Demasiadas solicitudes. Intenta más tarde.',
        });
        return;
      }
    }

    if (!dto.roomId) {
      this.logger.error('joinRoom: roomId es requerido');
      client.emit('error', {
        code: 'BAD_REQUEST',
        message: 'roomId es requerido',
      });
      return;
    }

    try {
      this.logger.debug(
        `joinRoom: Usuario ${userId} intentando entrar a ${dto.roomId}`,
      );

      // Validar que la sala exista
      const room = await this.webrtcService.getRoom(dto.roomId);
      this.logger.debug(
        `joinRoom: Sala existe. Participantes actuales: ${room.participants.size}/${room.maxParticipants}`,
      );

      // Agregar participante a la sala
      const participant = await this.webrtcService.addParticipant(
        dto.roomId,
        userId,
        client.id,
        dto.audio ?? true,
        dto.video ?? true,
      );

      // Unir socket a la room de Socket.IO
      await client.join(dto.roomId);
      this.socketToRoom.set(client.id, dto.roomId);

      // Obtener datos del usuario
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

      // Obtener lista de participantes actuales
      const participants = await this.webrtcService.getParticipants(dto.roomId);
      this.logger.debug(
        `joinRoom: Obtenidos ${participants.length} participantes`,
      );

      const participantsWithNames = await Promise.all(
        participants
          .filter((p) => p.userId !== userId) // No incluir al usuario actual
          .map(async (p) => {
            try {
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
            } catch (err) {
              this.logger.warn(
                `joinRoom: Error obteniendo datos de usuario ${p.userId}`,
                err,
              );
              return {
                userId: p.userId,
                name: null,
                lastName: null,
                username: `Usuario ${p.userId.substring(0, 8)}`,
                avatar: null,
                audio: p.audio,
                video: p.video,
                screen: p.screen,
              };
            }
          }),
      );

      // Emitir "joinedRoom" al usuario que entra
      client.emit('joinedRoom', {
        roomId: dto.roomId,
        user: currentUser,
        participants: participantsWithNames,
        totalParticipants: participants.length,
      });

      // Emitir "userJoined" a los demás
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

      this.logger.log(
        `✅ Usuario ${userId} se unió a room ${dto.roomId} (${participants.length}/${room.maxParticipants} participantes)`,
      );
    } catch (error) {
      this.logger.error(`Error en joinRoom para usuario ${userId}:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al unirse a la sala';
      const errorCode =
        error instanceof BadRequestException
          ? 'BAD_REQUEST'
          : error instanceof NotFoundException
            ? 'NOT_FOUND'
            : 'INTERNAL_ERROR';

      client.emit('error', {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // LEAVE ROOM
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

      this.logger.log(`Usuario ${userId} salió de room ${roomId}`);
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

    if (!userId) {
      this.logger.warn('offer: Usuario no autenticado');
      client.emit('error', { code: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }

    try {
      this.rateLimitService.checkLimit(userId, 200);
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        client.emit('error', {
          code: 'RATE_LIMITED',
          message: 'Demasiadas solicitudes',
        });
        return;
      }
    }

    if (!dto || !dto.roomId || !dto.targetUserId || !dto.sdp) {
      this.logger.warn('offer: Datos incompletos en DTO');
      client.emit('error', {
        code: 'BAD_REQUEST',
        message: 'Datos incompletos',
      });
      return;
    }

    try {
      // Validar que no sea peer a self
      if (dto.targetUserId === userId) {
        this.logger.warn('offer: Usuario no puede enviarse offer a sí mismo');
        client.emit('error', {
          code: 'BAD_REQUEST',
          message: 'No puedes enviar offer a ti mismo',
        });
        return;
      }

      // Validar que el usuario destino exista
      const targetSocket = this.getUserSocket(dto.targetUserId);
      if (!targetSocket) {
        this.logger.warn(
          `offer: Usuario destino ${dto.targetUserId} no conectado`,
        );
        client.emit('error', {
          code: 'NOT_FOUND',
          message: 'Usuario objetivo no disponible',
          targetUserId: dto.targetUserId,
        });
        return;
      }

      // Registrar offer en state machine
      this.signalingStateMachine.recordOfferSent(
        dto.roomId,
        userId,
        dto.targetUserId,
        dto.sequence ?? 0,
      );

      // Enviar offer al usuario destino
      this.server.to(targetSocket).emit('offer', {
        fromUserId: userId,
        sdp: dto.sdp as RTCSessionDescriptionInit,
        roomId: dto.roomId,
        sequence: dto.sequence,
        messageId: dto.messageId,
      });

      this.logger.debug(
        `Offer: ${userId} → ${dto.targetUserId} (seq: ${dto.sequence})`,
      );

      client.emit('offerAck', { success: true, sequence: dto.sequence });
    } catch (error) {
      this.logger.error(
        `Error en handleOffer: ${userId} → ${dto.targetUserId}`,
        error,
      );
      client.emit('error', {
        code: 'INTERNAL_ERROR',
        message: 'Error procesando offer',
      });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WebRTCSignalDto,
  ): void {
    const userId = (client.data as UserSocketData).userId;

    if (!userId) {
      this.logger.warn('answer: Usuario no autenticado');
      client.emit('error', { code: 'UNAUTHORIZED', message: 'No autenticado' });
      return;
    }

    try {
      this.rateLimitService.checkLimit(userId, 200);
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        client.emit('error', {
          code: 'RATE_LIMITED',
          message: 'Demasiadas solicitudes',
        });
        return;
      }
    }

    if (!dto || !dto.roomId || !dto.targetUserId || !dto.sdp) {
      this.logger.warn('answer: Datos incompletos en DTO');
      client.emit('error', {
        code: 'BAD_REQUEST',
        message: 'Datos incompletos',
      });
      return;
    }

    try {
      // Validar que no sea peer a self
      if (dto.targetUserId === userId) {
        this.logger.warn('answer: Usuario no puede enviarse answer a sí mismo');
        client.emit('error', {
          code: 'BAD_REQUEST',
          message: 'No puedes enviar answer a ti mismo',
        });
        return;
      }

      // Validar que el usuario destino exista
      const targetSocket = this.getUserSocket(dto.targetUserId);
      if (!targetSocket) {
        this.logger.warn(
          `answer: Usuario destino ${dto.targetUserId} no conectado`,
        );
        client.emit('error', {
          code: 'NOT_FOUND',
          message: 'Usuario objetivo no disponible',
        });
        return;
      }

      // Registrar answer en state machine
      this.signalingStateMachine.recordAnswerSent(
        dto.roomId,
        userId,
        dto.targetUserId,
        dto.sequence ?? 0,
      );

      // Enviar answer al usuario destino
      this.server.to(targetSocket).emit('answer', {
        fromUserId: userId,
        sdp: dto.sdp as RTCSessionDescriptionInit,
        roomId: dto.roomId,
        sequence: dto.sequence,
        messageId: dto.messageId,
      });

      this.logger.debug(
        `📥 Answer: ${userId} → ${dto.targetUserId} (seq: ${dto.sequence})`,
      );

      client.emit('answerAck', { success: true, sequence: dto.sequence });
    } catch (error) {
      this.logger.error(
        `Error en handleAnswer: ${userId} → ${dto.targetUserId}`,
        error,
      );
      client.emit('error', {
        code: 'INTERNAL_ERROR',
        message: 'Error procesando answer',
      });
    }
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IceCandidateDto,
  ): void {
    const userId = (client.data as UserSocketData).userId;

    if (!userId) {
      this.logger.warn('iceCandidate: Usuario no autenticado');
      return;
    }

    try {
      this.rateLimitService.checkLimit(userId, 500);
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        this.logger.warn(`Rate limit ICE candidates para ${userId}`);
        return;
      }
    }

    if (!dto || !dto.roomId || !dto.targetUserId || !dto.candidate) {
      this.logger.warn('iceCandidate: Datos incompletos');
      return;
    }

    try {
      // Verificar duplicados
      const hasDuplicate = this.iceCandidateBuffer.hasDuplicate(
        dto.roomId,
        userId,
        dto.targetUserId,
        dto.candidate,
      );

      if (hasDuplicate) {
        this.logger.debug(`ICE duplicado: ${userId} → ${dto.targetUserId}`);
        return;
      }

      // Bufferizar el candidate y obtener su número de secuencia
      const candidateSequence = this.iceCandidateBuffer.bufferCandidate(
        dto.roomId,
        userId,
        dto.targetUserId,
        dto.candidate,
      );

      // Actualizar estado de conexión ICE
      this.peerConnectionTracker.updateIceConnectionState(
        dto.roomId,
        userId,
        dto.targetUserId,
        'checking',
      );

      // Enviar a usuario destino
      const targetSocket = this.getUserSocket(dto.targetUserId);
      if (!targetSocket) {
        this.logger.debug(
          `iceCandidate: Usuario destino ${dto.targetUserId} no conectado`,
        );
        return;
      }

      this.server.to(targetSocket).emit('iceCandidate', {
        fromUserId: userId,
        candidate: dto.candidate as RTCIceCandidateInit,
        roomId: dto.roomId,
        sequence: dto.sequence,
        messageId: dto.messageId,
      });

      this.logger.debug(`ICE: ${userId} → ${dto.targetUserId}`);

      // Marcar como aplicado
      this.iceCandidateBuffer.markAsApplied(
        dto.roomId,
        userId,
        dto.targetUserId,
        [candidateSequence],
      );
    } catch (error) {
      this.logger.error(
        `Error en handleIceCandidate: ${userId} → ${dto.targetUserId}`,
        error,
      );
      // No emitir error al cliente, silenciar fallos de ICE candidates
    }
  }

  // CONNECTION STATE TRACKING
  @SubscribeMessage('connectionStateUpdate')
  handleConnectionStateUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      targetUserId: string;
      connectionState?: string;
      iceConnectionState?: string;
      iceGatheringState?: string;
    },
  ): void {
    const userId = (client.data as UserSocketData).userId;
    if (!userId) throw new UnauthorizedException();

    // Update connection states in tracker
    if (payload.connectionState) {
      this.peerConnectionTracker.updateConnectionState(
        payload.roomId,
        userId,
        payload.targetUserId,
        payload.connectionState as any,
      );
    }

    if (payload.iceConnectionState) {
      this.peerConnectionTracker.updateIceConnectionState(
        payload.roomId,
        userId,
        payload.targetUserId,
        payload.iceConnectionState as any,
      );
    }

    if (payload.iceGatheringState) {
      this.peerConnectionTracker.updateIceGatheringState(
        payload.roomId,
        userId,
        payload.targetUserId,
        payload.iceGatheringState as any,
      );
    }

    // Check for stale connections and failures
    if (payload.connectionState === 'failed') {
      this.peerConnectionTracker.recordFailure(
        payload.roomId,
        userId,
        payload.targetUserId,
      );
      const canRestart = this.peerConnectionTracker.canRestart(
        payload.roomId,
        userId,
        payload.targetUserId,
      );

      if (canRestart) {
        this.logger.log(
          `ICE restart recommended for ${userId} <-> ${payload.targetUserId}`,
        );
        this.server.to(client.id).emit('iceRestartRequired', {
          targetUserId: payload.targetUserId,
          roomId: payload.roomId,
        });
      } else {
        this.logger.warn(
          `ICE restart max attempts reached for ${userId} <-> ${payload.targetUserId}`,
        );
        this.server.to(client.id).emit('connectionFailed', {
          targetUserId: payload.targetUserId,
          roomId: payload.roomId,
          reason: 'max_restart_attempts',
        });
      }
    }

    this.logger.debug(
      `📊 Connection state updated: ${payload.roomId}:${userId}:${payload.targetUserId} -> ${payload.connectionState}`,
    );
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

  // CHAT
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

    if (payload.message.length > 5000) {
      client.emit('error', {
        message: 'Mensaje muy largo (máx 5000 caracteres)',
      });
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
    return this.userToSocket.get(userId);
  }
}
