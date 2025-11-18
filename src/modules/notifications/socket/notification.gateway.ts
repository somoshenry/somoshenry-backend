import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

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
  private activeUsers = new Map<string, string>(); // userId → socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeUsers.set(userId, client.id);
      this.logger.log(`🔌 Usuario conectado: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.activeUsers.entries()].find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.activeUsers.delete(userId);
      this.logger.log(` Usuario desconectado: ${userId}`);
    }
  }

  emitToUser(userId: string, event: string, payload: any) {
    const socketId = this.activeUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, payload);
      this.logger.log(`📨 Notificación enviada a ${userId}: ${event}`);
    }
  }
}
