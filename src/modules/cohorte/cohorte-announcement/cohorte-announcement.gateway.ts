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
import { Logger } from '@nestjs/common';

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
  private userRooms = new Map<string, string[]>(); // userId -> [cohorteId]

  handleConnection(client: Socket) {
    this.logger.debug(`🟢 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`🔴 Client disconnected: ${client.id}`);
  }

  /** el front llama cuando el user entra a su cohorte */
  @SubscribeMessage('joinCohorte')
  joinCohorteRoom(
    @MessageBody() data: { userId: string; cohorteId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.cohorteId);
    const existing = this.userRooms.get(data.userId) || [];
    if (!existing.includes(data.cohorteId)) existing.push(data.cohorteId);
    this.userRooms.set(data.userId, existing);
    this.logger.debug(
      `User ${data.userId} joined cohorte room ${data.cohorteId}`,
    );
  }

  /** enviar evento a todos los miembros de ese cohorte */
  emitAnnouncement(cohorteId: string, announcement: any) {
    this.server
      .to(cohorteId)
      .emit('cohorte.announcement.created', announcement);
    this.logger.debug(`📢 Sent announcement to room ${cohorteId}`);
  }
}
