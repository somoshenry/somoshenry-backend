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
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, MessageType } from './entities/message.entity';
import { EventDispatcherService } from '../../common/events/event-dispatcher.service';
import Redis from 'ioredis';
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

  private redisPub!: Redis;
  private redisSub!: Redis;
  private redis!: Redis;
  private readonly ONLINE_SET = 'chat:onlineUsers';
  private readonly TYPING_SET = 'chat:typingUsers';

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

  // --------------------------
  // INIT + REDIS
  // --------------------------
  afterInit(server: Server): void {
    this.server = server;

    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

    this.redisPub = new Redis(redisUrl);
    this.redisSub = new Redis(redisUrl);
    this.redis = this.redisPub;

    this.server.adapter(createAdapter(this.redisPub, this.redisSub));

    this.registerEventListeners();
    this.logger.log('ChatGateway listo con Redis + Socket.IO');
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
      const userId = payload.sub ?? payload.id;

      if (!userId) {
        throw new UnauthorizedException('Token inválido');
      }

      const data = client.data as UserSocketData;
      data.userId = userId;
      client.data.userId = userId;

      // Guardar en memoria local y Redis
      this.onlineUsers.set(userId, client.id);
      if (this.redis) {
        await this.redis.sadd(this.ONLINE_SET, userId);
      }

      await this.broadcastOnlineUsers();

      this.logger.log(`✅ Usuario conectado: ${userId}`);
    } catch (err) {
      this.logger.error('❌ Error al autenticar socket', err);
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
    if (this.redis) {
      await this.redis.srem(this.ONLINE_SET, userId);
    }

    await this.broadcastOnlineUsers();

    this.logger.log(`🔴 Usuario desconectado: ${userId}`);
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

  // --------------------------
  // EVENTOS WS
  // --------------------------
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ): Promise<void> {
    if (!conversationId) {
      throw new BadRequestException('conversationId es obligatorio');
    }

    await client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
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

      this.server.to(dto.conversationId).emit('messageReceived', message);
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
    this.server.to(groupId).emit('messageReceived', message);
  }

  // --------------------------
  // EVENTOS DE DOMINIO (EventDispatcher)
  // --------------------------
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

  // --------------------------
  // MÉTODO AUXILIAR PÚBLICO
  // --------------------------
  emitNewMessage(message: Message): void {
    const conversationId = message.conversation?.id;
    if (!conversationId) return;

    this.server.to(conversationId).emit('newMessage', message);
  }
}
