import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CohorteMember } from '../cohorte/entities/cohorte-member.entity';

interface JwtPayload {
  sub?: string;
  id?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/cohorte-announcement',
})
export class CohorteAnnouncementGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('CohorteAnnouncementGateway');

  // userId -> Set<cohorteId>
  private userRooms = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(CohorteMember)
    private readonly memberRepo: Repository<CohorteMember>,
  ) {}

  // ========================
  //  CONEXIÓN / AUTENTICACIÓN
  // ========================
  async handleConnection(client: Socket): Promise<void> {
    try {
      const rawAuth = client.handshake.headers.authorization as
        | string
        | undefined;

      const tokenFromHeader =
        rawAuth && rawAuth.startsWith('Bearer ')
          ? rawAuth.substring(7)
          : undefined;

      const token =
        (client.handshake.auth?.token as string | undefined) || tokenFromHeader;

      if (!token) {
        this.logger.warn(`Client ${client.id} sin token, desconectando`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub ?? payload.id;
      if (!userId) {
        throw new UnauthorizedException('Token inválido');
      }

      client.data.userId = userId;

      this.logger.debug(`🟢 Client conectado: ${client.id} (userId=${userId})`);
    } catch (error) {
      this.logger.error(
        `Error autenticando socket ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.userRooms.delete(userId);
    }
    this.logger.debug(`🔴 Client desconectado: ${client.id}`);
  }

  // ========================
  //  ROOMS POR COHORTE
  // ========================

  /**
   * El front emite cuando el user entra a la vista del cohorte.
   * payload esperado: { cohorteId: string }
   */
  @SubscribeMessage('joinCohorte')
  async joinCohorteRoom(
    @MessageBody() data: { cohorteId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // validar que el usuario pertenece a ese cohorte
    const member = await this.memberRepo.findOne({
      where: { cohorte: { id: data.cohorteId }, user: { id: userId } },
    });

    if (!member) {
      this.logger.warn(
        `User ${userId} intentó unirse a cohorte ${data.cohorteId} sin ser miembro`,
      );
      throw new ForbiddenException('No perteneces a esta cohorte');
    }

    client.join(data.cohorteId);

    let rooms = this.userRooms.get(userId);
    if (!rooms) {
      rooms = new Set<string>();
      this.userRooms.set(userId, rooms);
    }
    rooms.add(data.cohorteId);

    this.logger.debug(`User ${userId} joined cohorte room ${data.cohorteId}`);
  }

  /**
   * Opcional: el front emite cuando sale de esa vista.
   * payload esperado: { cohorteId: string }
   */
  @SubscribeMessage('leaveCohorte')
  leaveCohorteRoom(
    @MessageBody() data: { cohorteId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    client.leave(data.cohorteId);

    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.delete(data.cohorteId);
      if (rooms.size === 0) this.userRooms.delete(userId);
    }

    this.logger.debug(`User ${userId} left cohorte room ${data.cohorteId}`);
  }

  // ========================
  //  EMISIÓN DE ANUNCIOS
  // ========================
  /** Llamado desde el service cuando se crea un anuncio */
  emitAnnouncement(cohorteId: string, announcement: any): void {
    this.server
      .to(cohorteId)
      .emit('cohorte.announcement.created', announcement);

    this.logger.debug(`📢 Sent announcement to room ${cohorteId}`);
  }
}
