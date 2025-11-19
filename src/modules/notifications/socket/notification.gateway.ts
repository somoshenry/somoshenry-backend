import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private activeUsers = new Map<string, string>();

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('notification.created')
  handleNotificationCreated(notification: Notification): void {
    this.emitToUser(notification.receiverId, 'notification:new', notification);
  }

  async handleConnection(client: Socket): Promise<void> {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      this.activeUsers.set(userId, client.id);
      this.logger.log(`Usuario conectado: ${userId}`);

      try {
        const unreadNotifications =
          await this.notificationService.findAllForUser(userId);

        if (unreadNotifications.length > 0) {
          client.emit('notification:sync', unreadNotifications);
          this.logger.log(
            `📥 Sincronizadas ${unreadNotifications.length} notificaciones para ${userId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error sincronizando notificaciones para ${userId}:`,
          error,
        );
      }
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = [...this.activeUsers.entries()].find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.activeUsers.delete(userId);
      this.logger.log(`Usuario desconectado: ${userId}`);
    }
  }

  emitToUser(userId: string, event: string, payload: any): void {
    const socketId = this.activeUsers.get(userId);

    if (socketId) {
      this.server.to(socketId).emit(event, payload);
      this.logger.log(`Notificación enviada a ${userId}: ${event}`);
    }
  }
}
