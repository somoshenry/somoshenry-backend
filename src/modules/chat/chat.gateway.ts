import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { Conversation } from './entities/conversation.entity';

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, string>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  // === CLIENT CONNECTION ===
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(token);
      } catch {
        this.logger.warn('❌ Token inválido al conectar');
        client.disconnect();
        return;
      }

      const userId = payload?.sub || payload?.id;
      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      this.onlineUsers.set(userId, client.id);
      this.broadcastOnlineUsers();
      this.logger.debug(`🟢 Usuario conectado: ${userId}`);
    } catch (err) {
      this.logger.error('❌ Error en handleConnection', err);
      client.disconnect();
    }
  }

  // === CLIENT DISCONNECTION ===
  handleDisconnect(client: Socket): void {
    const userId = [...this.onlineUsers.entries()].find(
      ([, id]) => id === client.id,
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      this.broadcastOnlineUsers();
      this.logger.debug(`❎ Usuario desconectado: ${userId}`);
    }
  }

  // === ONLINE USERS ===
  private broadcastOnlineUsers(): void {
    const users = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

  // === JOIN CONVERSATION ===
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    if (!conversationId) return;
    client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

  // === SEND MESSAGE ===
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    try {
      const userId: string = client.data.userId;
      if (!userId) throw new Error('Usuario no autenticado');

      const message: Message = await this.chatService.sendMessage(userId, dto);
      const conversation: Conversation | null =
        await this.chatService.getConversationById(dto.conversationId);

      if (!conversation) throw new Error('Conversación no encontrada');

      const receiver = conversation.participants.find((p) => p.id !== userId);
      const receiverId = receiver?.id;

      // Emitir mensaje al room
      this.server.to(dto.conversationId).emit('messageReceived', message);

      // Confirmar al emisor
      client.emit('messageDelivered', message);

      // Notificación interna
      if (receiverId) {
        this.eventDispatcher.dispatch({
          name: 'message.created',
          payload: {
            userId,
            result: {
              id: message.id,
              conversationId: dto.conversationId,
              content: message.content,
              receiverId,
            },
          },
        });
      }
    } catch (error) {
      this.logger.error('❌ Error al enviar mensaje', error);
      client.emit('messageError', { error: 'Error al enviar mensaje' });
    }
  }

  // === MARK AS READ ===
  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    try {
      const updated = await this.chatService.markMessageAsRead(messageId);
      this.server.emit('messageRead', updated);
    } catch (err) {
      this.logger.error('❌ Error marcando mensaje leído', err);
    }
  }

  // === TYPING EVENT ===
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ): void {
    const userId = client.data.userId;
    if (!data?.conversationId) return;

    this.server.to(data.conversationId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }

  // === EMIT FROM SERVICE (attachments / media) ===
  emitNewMessage(message: Message): void {
    const conversationId = message.conversation?.id;
    if (!conversationId) return;

    this.server.to(conversationId).emit('newMessage', message);
  }
}
