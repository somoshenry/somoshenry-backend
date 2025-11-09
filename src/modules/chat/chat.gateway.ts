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
 * Gateway WebSocket del chat.
 * Maneja conexiones, mensajes, y eventos en tiempo real.
 */
@WebSocketGateway({ cors: { origin: '*' } })
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

  // --------------------------
  // CONEXIÓN / DESCONEXIÓN
  // --------------------------

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Token no enviado');
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
      this.logger.error('Error al autenticar socket', err);
      client.disconnect();
    }
  }

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

  private broadcastOnlineUsers(): void {
    const users = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

  // --------------------------
  // CHAT PRIVADO
  // --------------------------

  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    if (!conversationId)
      throw new BadRequestException('conversationId es obligatorio');

    await client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

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
      if (!conversation)
        throw new BadRequestException('Conversación no encontrada');

      this.server.to(dto.conversationId).emit('messageReceived', message);
      client.emit('messageDelivered', message);

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

  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    try {
      const updated = await this.chatService.markMessageAsRead(messageId);
      this.server.emit('messageRead', updated);
    } catch (err) {
      this.logger.error('Error al marcar como leído', err);
    }
  }

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

  // --------------------------
  // CHAT GRUPAL
  // --------------------------

  @SubscribeMessage('joinGroup')
  async joinGroup(
    @MessageBody('groupId') groupId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!groupId) throw new BadRequestException('El ID del grupo es requerido');
    const userId: string = client.data.userId;
    const isMember = await this.chatService.isGroupMember(groupId, userId);
    if (!isMember) throw new ForbiddenException('No perteneces a este grupo');

    await client.join(groupId);
    this.server.to(groupId).emit('systemMessage', {
      content: 'Un usuario se unió al grupo',
      groupId,
    });
  }

  @SubscribeMessage('leaveGroup')
  async leaveGroup(
    @MessageBody('groupId') groupId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!groupId) throw new BadRequestException('groupId es obligatorio');
    await client.leave(groupId);

    this.server.to(groupId).emit('systemMessage', {
      content: 'Un usuario salió del grupo',
      groupId,
    });
  }

  @SubscribeMessage('sendGroupMessage')
  async sendGroupMessage(
    @MessageBody()
    payload: {
      groupId: string;
      senderId: string;
      content: string;
      type?: MessageType;
    },
  ): Promise<void> {
    const { groupId, senderId, content, type } = payload;
    if (!groupId || !senderId || !content)
      throw new BadRequestException(
        'Faltan datos para enviar el mensaje grupal',
      );

    const isMember = await this.chatService.isGroupMember(groupId, senderId);
    if (!isMember) throw new ForbiddenException('No perteneces a este grupo');

    const message = await this.chatService.sendGroupMessage(
      senderId,
      groupId,
      content,
      type ?? MessageType.TEXT,
    );
    this.server.to(groupId).emit('newGroupMessage', message);
  }

  // --------------------------
  // EVENTOS INTERNOS
  // --------------------------

  private registerEventListeners(): void {
    const safeOn = <T extends object>(
      event: string,
      handler: (payload: T) => void,
    ): void => {
      try {
        this.eventDispatcher.on(event, handler as any);
      } catch (error) {
        this.logger.error(`Error registrando listener para ${event}`, error);
      }
    };

    safeOn<{ groupId: string; message: Message }>(
      'group.message.created',
      ({ groupId, message }) => {
        this.server.to(groupId).emit('newGroupMessage', message);
      },
    );

    safeOn<{
      groupId: string;
      name: string;
      imageUrl?: string;
      members: string[];
    }>('group.created', ({ groupId, name, imageUrl, members }) => {
      this.server.emit('groupCreated', { groupId, name, imageUrl, members });
    });

    safeOn<{ groupId: string; changes: Record<string, any> }>(
      'group.updated',
      ({ groupId, changes }) => {
        this.server.to(groupId).emit('groupUpdated', { groupId, changes });
      },
    );

    safeOn<{ groupId: string; userIds: string[] }>(
      'group.member.added',
      ({ groupId, userIds }) => {
        this.server.to(groupId).emit('memberAdded', { groupId, userIds });
      },
    );

    safeOn<{ groupId: string; targetUserId: string }>(
      'group.member.promoted',
      ({ groupId, targetUserId }) => {
        this.server.to(groupId).emit('memberPromoted', {
          groupId,
          userId: targetUserId,
        });
      },
    );

    safeOn<{ groupId: string; targetUserId: string }>(
      'group.member.removed',
      ({ groupId, targetUserId }) => {
        this.server.to(groupId).emit('memberRemoved', {
          groupId,
          userId: targetUserId,
        });
      },
    );

    safeOn<{ groupId: string; userId: string }>(
      'group.member.left',
      ({ groupId, userId }) => {
        this.server.to(groupId).emit('memberLeft', { groupId, userId });
      },
    );
  }

  /**
   * Permite emitir un nuevo mensaje (por ejemplo, archivos o multimedia).
   */
  emitNewMessage(message: Message): void {
    const conversationId = message.conversation?.id;
    if (!conversationId) return;
    this.server.to(conversationId).emit('newMessage', message);
  }
}
