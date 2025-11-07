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

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // === CONEXIÓN DE CLIENTE ===
  async handleConnection(client: Socket): Promise<void> {
    console.log('🟢 Intentando nueva conexión de socket...');
    console.log('Handshake:', client.handshake);
    console.log('Auth recibido:', client.handshake.auth);

    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        console.warn('⚠️ No se recibió token, desconectando cliente.');
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
        console.warn('⚠️ Token sin ID de usuario.');
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      this.onlineUsers.set(userId, client.id);

      console.log(`✅ Usuario conectado: ${userId} (socket ${client.id})`);
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
    console.log('📡 Usuarios online:', users);
    this.server.emit('onlineUsers', users);
  }

  // === UNIRSE A UNA CONVERSACIÓN ===
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    console.log(`📥 Usuario ${client.data.userId} se une a ${conversationId}`);
    client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

  // === ENVIAR MENSAJE ===
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    try {
      const userId: string = client.data.userId;
      console.log('📩 Mensaje recibido del cliente:', dto);

      // Crear mensaje real en base de datos
      const message: Message = await this.chatService.sendMessage(userId, dto);

      // Emitir mensaje a todos los de la conversación (incluye emisor)
      this.server.to(dto.conversationId).emit('messageReceived', message);

      // Confirmar al cliente que lo envió (para reemplazar el temporal)
      client.emit('messageDelivered', message);

      console.log(
        `✅ Mensaje guardado y emitido en conversación ${dto.conversationId}`,
      );
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      client.emit('messageError', { error: 'Error al enviar mensaje' });
    }
  }

  // === MARCAR COMO LEÍDO ===
  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    console.log('👁️ Marcando mensaje leído:', messageId);
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
    console.log(`⌨️ ${userId} está escribiendo en ${data.conversationId}`);
    this.server.to(data.conversationId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }
}
