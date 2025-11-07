import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers: Map<string, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token: string | undefined = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload: any = this.jwtService.verify(token);
      const userId: string | undefined = payload?.sub || payload?.id;
      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      this.onlineUsers.set(userId, client.id);
      this.broadcastOnlineUsers();
      console.log(`✅ Usuario conectado: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = [...this.onlineUsers.entries()].find(
      ([_, id]) => id === client.id,
    )?.[0];
    if (userId) {
      this.onlineUsers.delete(userId);
      this.broadcastOnlineUsers();
      console.log(`❎ Usuario desconectado: ${userId}`);
    }
  }

  private broadcastOnlineUsers(): void {
    const users: string[] = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    const userId: string = client.data.userId;
    const message: Message = await this.chatService.sendMessage(userId, dto);
    this.server.to(dto.conversationId).emit('messageReceived', message);
  }

  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    const updated: Message =
      await this.chatService.markMessageAsRead(messageId);
    this.server.emit('messageRead', updated);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ): void {
    const userId: string = client.data.userId;
    this.server.to(data.conversationId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }
}
