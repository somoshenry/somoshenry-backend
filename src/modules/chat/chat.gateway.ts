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
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    // Constructor — mantené el nombre "eventDispatcher" para usarlo igual que en el resto del código
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  // === CONEXIÓN DE CLIENTE ===
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
      } catch (err) {
        console.error('❌ Token inválido:', err.message);
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
    } catch (err) {
      console.error('❌ Error general en handleConnection:', err);
      client.disconnect();
    }
  }

  // === DESCONEXIÓN ===
  handleDisconnect(client: Socket): void {
    const userId = [...this.onlineUsers.entries()].find(
      ([, id]) => id === client.id,
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      this.broadcastOnlineUsers();
      console.log(`❎ Usuario desconectado: ${userId}`);
    } else {
      console.log(`⚠️ Cliente desconectado sin usuario (id: ${client.id})`);
    }
  }

  // === EMISIÓN DE USUARIOS EN LÍNEA ===
  private broadcastOnlineUsers(): void {
    const users = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

  // === UNIRSE A UNA CONVERSACIÓN ===
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

  // === ENVIAR MENSAJE ===
  // === ENVIAR MENSAJE ===
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    try {
      const userId: string = client.data.userId;

      // 🟢 Guardar mensaje real en base de datos
      const message: Message = await this.chatService.sendMessage(userId, dto);

      // 🟢 Buscar receptor desde la conversación
      const conversation = await this.chatService.getConversationById(
        dto.conversationId,
      );
      const receiver = conversation?.participants?.find((p) => p.id !== userId);
      const receiverId = receiver?.id;

      // 🟢 Emitir el mensaje al room
      this.server.to(dto.conversationId).emit('messageReceived', message);

      // 🟢 Confirmar al cliente que lo envió
      client.emit('messageDelivered', message);

      // 🔔 Despachar evento para notificación
      // 🔔 Despachar evento para notificación
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
      console.error('❌ Error al enviar mensaje:', error);
      client.emit('messageError', { error: 'Error al enviar mensaje' });
    }
  }

  // === MARCAR COMO LEÍDO ===
  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    try {
      const updated = await this.chatService.markMessageAsRead(messageId);
      this.server.emit('messageRead', updated);
    } catch (err) {
      console.error('❌ Error marcando mensaje leído:', err);
    }
  }

  // === EVENTO DE ESCRITURA ===
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ): void {
    const userId = client.data.userId;
    this.server.to(data.conversationId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }
}
