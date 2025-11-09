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
  Inject,
  forwardRef,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { Message, MessageType } from './entities/message.entity';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { Conversation } from './entities/conversation.entity';

interface JwtPayload {
  sub?: string;
  id?: string;
}

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

/**
 * Gateway WebSocket principal para manejo de chat privado y grupal.
 * Gestiona conexiones, mensajes, notificaciones en tiempo real y eventos del dominio.
 */
@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, string>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {
    this.registerEventListeners();
  }

  // ------------------------------
  // CONEXIÓN Y DESCONEXIÓN
  // ------------------------------

  /**
   * Se ejecuta al establecer conexión. Verifica el JWT y registra al usuario.
   */
  async handleConnection(client: Socket): Promise<void> {
    const token: string | undefined = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload?.sub ?? payload?.id;
      if (!userId) throw new UnauthorizedException('Token inválido');

      client.data.userId = userId;
      this.onlineUsers.set(userId, client.id);

      this.broadcastOnlineUsers();
      this.logger.log(`Usuario conectado: ${userId}`);
    } catch (err) {
      this.logger.error('Error al autenticar conexión', err);
      client.disconnect();
    }
  }

  /**
   * Se ejecuta cuando el cliente se desconecta.
   * Elimina al usuario del registro de conexiones activas.
   */
  handleDisconnect(client: Socket): void {
    const userId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      this.broadcastOnlineUsers();
      this.logger.log(`Usuario desconectado: ${userId}`);
    }
  }

  /**
   * Envía a todos los clientes la lista actualizada de usuarios conectados.
   */
  private broadcastOnlineUsers(): void {
    const users = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

  // ------------------------------
  // CONVERSACIONES PRIVADAS
  // ------------------------------

  /**
   * El cliente se une a una conversación privada.
   */
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    if (!conversationId) {
      throw new BadRequestException('El ID de la conversación es requerido');
    }

    await client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

  /**
   * Envía un mensaje en una conversación privada.
   */
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    try {
      const userId: string = client.data.userId;
      if (!userId) throw new UnauthorizedException('Usuario no autenticado');

      const message = await this.chatService.sendMessage(userId, dto);
      const conversation = await this.chatService.getConversationById(
        dto.conversationId,
      );
      if (!conversation) {
        throw new BadRequestException('Conversación no encontrada');
      }

      // Emitir mensaje a todos los sockets en esa conversación
      this.server.to(dto.conversationId).emit('messageReceived', message);

      // Confirmar al emisor
      client.emit('messageDelivered', message);

      // Notificar internamente (para disparar notificaciones u otros eventos)
      const receiver = conversation.participants.find((p) => p.id !== userId);
      if (receiver?.id) {
        this.eventDispatcher.dispatch({
          name: 'message.created',
          payload: {
            userId,
            result: {
              id: message.id,
              conversationId: dto.conversationId,
              content: message.content,
              receiverId: receiver.id,
            },
          },
        });
      }
    } catch (error) {
      this.logger.error('Error al enviar mensaje', error);
      client.emit('messageError', { error: 'No se pudo enviar el mensaje' });
    }
  }

  /**
   * Marca un mensaje como leído.
   */
  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    try {
      const updated = await this.chatService.markMessageAsRead(messageId);
      this.server.emit('messageRead', updated);
    } catch (err) {
      this.logger.error('Error al marcar mensaje como leído', err);
    }
  }

  /**
   * Notifica cuando un usuario está escribiendo.
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ): void {
    if (!data?.conversationId) return;
    const userId: string = client.data.userId;
    this.server.to(data.conversationId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }

  // ------------------------------
  // GRUPOS
  // ------------------------------

  /**
   * El usuario se une a un grupo.
   */
  @SubscribeMessage('joinGroup')
  async joinGroup(
    @MessageBody('groupId') groupId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!groupId) {
      throw new BadRequestException('El ID del grupo es requerido');
    }

    await client.join(groupId);
    this.server.to(groupId).emit('systemMessage', {
      content: 'Un usuario se unió al grupo',
      groupId,
    });
  }

  /**
   * El usuario abandona un grupo.
   */
  @SubscribeMessage('leaveGroup')
  async leaveGroup(
    @MessageBody('groupId') groupId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!groupId) {
      throw new BadRequestException('El ID del grupo es requerido');
    }

    await client.leave(groupId);
    this.server.to(groupId).emit('systemMessage', {
      content: 'Un usuario salió del grupo',
      groupId,
    });
  }

  /**
   * Envía un mensaje dentro de un grupo.
   */
  @SubscribeMessage('sendGroupMessage')
  async sendGroupMessage(
    @MessageBody()
    payload: SendGroupMessageDto & { groupId: string; senderId: string },
  ): Promise<void> {
    const { groupId, senderId, content, type } = payload;
    if (!groupId || !senderId || !content) {
      throw new BadRequestException(
        'Faltan datos para enviar el mensaje grupal',
      );
    }

    const message = await this.chatService.sendGroupMessage(
      senderId,
      groupId,
      content,
      type ?? MessageType.TEXT,
    );

    this.server.to(groupId).emit('newGroupMessage', message);
  }

  // ------------------------------
  // EVENTOS INTERNOS (DOMINIO)
  // ------------------------------

  /**
   * Se suscribe a eventos del dominio (promoción, eliminación o salida de miembros).
   */
  private registerEventListeners(): void {
    const safeOn = (
      event: string,
      handler: (payload: Record<string, unknown>) => void,
    ): void => {
      if (typeof (this.eventDispatcher as any).on === 'function') {
        (this.eventDispatcher as any).on(event, handler);
      }
    };

    safeOn('group.member.promoted', ({ groupId, targetUserId }) => {
      this.server.to(groupId as string).emit('memberPromoted', {
        groupId,
        userId: targetUserId,
        message: 'Un miembro fue promovido a administrador',
      });
    });

    safeOn('group.member.removed', ({ groupId, targetUserId }) => {
      this.server.to(groupId as string).emit('memberRemoved', {
        groupId,
        userId: targetUserId,
        message: 'Un miembro fue eliminado del grupo',
      });
    });

    safeOn('group.member.left', ({ groupId, userId }) => {
      this.server.to(groupId as string).emit('memberLeft', {
        groupId,
        userId,
        message: 'Un miembro abandonó el grupo',
      });
    });
  }

  /**
   * Permite emitir mensajes desde el servicio (por ejemplo, multimedia).
   */
  emitNewMessage(message: Message): void {
    const conversationId = message.conversation?.id;
    if (!conversationId) return;
    this.server.to(conversationId).emit('newMessage', message);
  }
}
