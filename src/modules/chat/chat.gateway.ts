import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import {
  Inject,
  forwardRef,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatPubSubService } from './chat-pubsub.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, MessageType } from './entities/message.entity';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import { RedisService } from '../../common/services/redis.service';
import { createAdapter } from '@socket.io/redis-adapter';

interface JwtPayload {
  sub?: string;
  id?: string;
}

interface UserSocketData {
  userId?: string;
}

interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

interface EventEmitterLike {
  on(event: string, handler: (payload: unknown) => void): void;
}

interface EventDispatcherWithEmitter {
  emitter?: EventEmitterLike;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, string>();

  private readonly ONLINE_SET = 'chat:onlineUsers';

  private isRedisEnabled = false;

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly eventDispatcher: EventDispatcherService,
    private readonly redisService: RedisService,
    private readonly chatPubSubService: ChatPubSubService,
  ) {}

  // INIT + REDIS

  afterInit(server: Server): void {
    this.server = server;

    const redisPub = this.redisService.getRedisPub();
    const redisSub = this.redisService.getRedisSub();

    // LOCAL → SIN REDIS
    if (!redisPub || !redisSub) {
      this.logger.warn('Redis desactivado (modo local)');
      this.registerEventListeners();
      return;
    }

    // PRODUCCIÓN → CON REDIS
    this.isRedisEnabled = true;
    this.server.adapter(createAdapter(redisPub, redisSub));

    this.registerEventListeners();
    this.logger.log('ChatGateway listo con Redis Pub/Sub + Socket.IO');
  }

  // CONEXIÓN / DESCONEXIÓN

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Token no enviado');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub ?? payload.id;

      if (!userId) {
        throw new UnauthorizedException('Token inválido');
      }

      const data = client.data as UserSocketData;
      data.userId = userId;
      client.data.userId = userId;

      // Guardar en memoria local y Redis
      this.onlineUsers.set(userId, client.id);
      if (this.isRedisEnabled) {
        const redis = this.redisService.getRedis();
        if (redis) {
          await redis.sadd(this.ONLINE_SET, userId);
        }
      }

      await this.broadcastOnlineUsers();

      this.logger.log(`Usuario conectado: ${userId}`);
    } catch (err) {
      this.logger.error('Error al autenticar socket', err);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (!userId) return;

    // Eliminar de memoria local y Redis
    this.onlineUsers.delete(userId);
    if (this.isRedisEnabled) {
      const redis = this.redisService.getRedis();
      if (redis) {
        await redis.srem(this.ONLINE_SET, userId);
      }
    }

    await this.broadcastOnlineUsers();

    this.logger.log(`Usuario desconectado: ${userId}`);
  }

  private findUserIdBySocket(socketId: string): string | undefined {
    for (const [userId, id] of this.onlineUsers.entries()) {
      if (id === socketId) return userId;
    }
    return undefined;
  }

  private async broadcastOnlineUsers(): Promise<void> {
    const users = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

  // EVENTOS WS

  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    if (!conversationId) {
      throw new BadRequestException('conversationId es obligatorio');
    }

    await client.join(conversationId);

    if (this.isRedisEnabled) {
      void this.setupDMChannelListener(conversationId);
    }

    client.emit('joinedConversation', { conversationId });
  }

  private async setupDMChannelListener(conversationId: string): Promise<void> {
    if (this.chatPubSubService.isDMSubscribed(conversationId)) {
      return;
    }

    try {
      await this.chatPubSubService.subscribeToDirectMessage(
        conversationId,
        (payload) => {
          const messagePayload = payload as Record<string, unknown>;
          const message = messagePayload.message;
          if (message) {
            this.server.to(conversationId).emit('messageReceived', message);
          }
        },
      );
    } catch (error) {
      this.logger.error(
        `Error subscribing to DM channel ${conversationId}:`,
        error,
      );
    }
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ): Promise<void> {
    const data = client.data as UserSocketData;
    const userId = data.userId;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      const message = await this.chatService.sendMessage(userId, dto);

      if (this.isRedisEnabled) {
        await this.chatPubSubService.publishDirectMessage(dto.conversationId, {
          type: 'message.sent',
          conversationId: dto.conversationId,
          senderId: userId,
          message,
        });
      } else {
        this.server.to(dto.conversationId).emit('messageReceived', message);
      }

      client.emit('messageDelivered', message);
    } catch (error) {
      this.logger.error('Error al enviar mensaje', error);
      client.emit('messageError', { error: 'No se pudo enviar el mensaje' });
    }
  }

  @SubscribeMessage('markAsRead')
  async markAsRead(@MessageBody('messageId') messageId: string): Promise<void> {
    const updated = await this.chatService.markMessageAsRead(messageId);
    this.server.emit('messageRead', updated);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ): void {
    if (!data.conversationId) return;

    const socketData = client.data as UserSocketData;
    const userId = socketData.userId;
    if (!userId) return;

    this.server.to(data.conversationId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('joinGroup')
  async joinGroup(
    @MessageBody('groupId') groupId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!groupId) {
      throw new BadRequestException();
    }

    const data = client.data as UserSocketData;
    const userId = data.userId;
    if (!userId) throw new UnauthorizedException();

    const isMember = await this.chatService.isGroupMember(groupId, userId);
    if (!isMember) throw new ForbiddenException();

    await client.join(groupId);

    if (this.isRedisEnabled) {
      void this.setupGroupChannelListener(groupId);
    }

    this.server.to(groupId).emit('systemMessage', {
      content: 'Un usuario se unió al grupo',
      groupId,
    });
  }

  private async setupGroupChannelListener(groupId: string): Promise<void> {
    if (this.chatPubSubService.isGroupSubscribed(groupId)) {
      return;
    }

    try {
      await this.chatPubSubService.subscribeToGroupMessages(
        groupId,
        (payload) => {
          const messagePayload = payload as Record<string, unknown>;
          const message = messagePayload.message;
          if (message) {
            this.server.to(groupId).emit('messageReceived', message);
          }
        },
      );
    } catch (error) {
      this.logger.error(
        `Error subscribing to group channel ${groupId}:`,
        error,
      );
    }
  }

  @SubscribeMessage('leaveGroup')
  async leaveGroup(
    @MessageBody('groupId') groupId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!groupId) throw new BadRequestException();

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

    if (!groupId || !senderId || !content) {
      throw new BadRequestException();
    }

    const isMember = await this.chatService.isGroupMember(groupId, senderId);
    if (!isMember) throw new ForbiddenException();

    const message = await this.chatService.sendGroupMessage(
      senderId,
      groupId,
      content,
      type ?? MessageType.TEXT,
    );

    if (this.isRedisEnabled) {
      await this.chatPubSubService.publishGroupMessage(groupId, {
        type: 'message.sent',
        groupId,
        senderId,
        message,
      });
    } else {
      this.server.to(groupId).emit('messageReceived', message);
    }
  }

  // EVENTOS DE DOMINIO (EventDispatcher)

  private registerEventListeners(): void {
    const dispatcher = this
      .eventDispatcher as unknown as EventDispatcherWithEmitter;
    const emitter = dispatcher.emitter;

    if (!emitter) {
      this.logger.warn(
        'EventDispatcher no tiene emitter, no se registran listeners de grupo',
      );
      return;
    }

    emitter.on('group.message.created', (payload) => {
      const { groupId, message } = payload as {
        groupId: string;
        message: Message;
      };
      this.server.to(groupId).emit('messageReceived', message);
    });

    emitter.on('group.created', (payload) => {
      const data = payload as {
        groupId: string;
        name: string;
        imageUrl?: string;
        members: string[];
      };
      for (const userId of data.members) {
        const socketId = this.onlineUsers.get(userId);
        if (socketId) {
          this.server.to(socketId).emit('groupCreated', {
            groupId: data.groupId,
            name: data.name,
            imageUrl: data.imageUrl,
            members: data.members,
          });
        }
      }
    });

    emitter.on('group.updated', (payload) => {
      const data = payload as {
        groupId: string;
        changes: Record<string, unknown>;
      };
      this.server.to(data.groupId).emit('groupUpdated', data);
    });

    emitter.on('group.member.added', (payload) => {
      const data = payload as { groupId: string; userIds: string[] };
      this.server.to(data.groupId).emit('memberAdded', data);
    });

    emitter.on('group.member.promoted', (payload) => {
      const data = payload as { groupId: string; targetUserId: string };
      this.server.to(data.groupId).emit('memberPromoted', {
        groupId: data.groupId,
        userId: data.targetUserId,
      });
    });

    emitter.on('group.member.removed', (payload) => {
      const data = payload as { groupId: string; targetUserId: string };
      this.server.to(data.groupId).emit('memberRemoved', {
        groupId: data.groupId,
        userId: data.targetUserId,
      });
    });

    emitter.on('group.member.left', (payload) => {
      const data = payload as { groupId: string; userId: string };
      this.server.to(data.groupId).emit('memberLeft', data);
    });

    emitter.on('group.deleted', (payload) => {
      const data = payload as { groupId: string };
      this.server.to(data.groupId).emit('groupDeleted', data);
    });
  }

  // MÉTODO AUXILIAR PÚBLICO

  emitNewMessage(message: Record<string, unknown>): void {
    const conversationId = message.conversationId as string;
    if (!conversationId) return;

    if (this.isRedisEnabled) {
      void this.chatPubSubService.publishDirectMessage(conversationId, {
        type: 'message.sent',
        conversationId,
        message,
      });
    } else {
      this.server.to(conversationId).emit('newMessage', message);
    }
  }
}
