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

import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { createClient } from 'redis';

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
  private redis: ReturnType<typeof createClient>;
  private readonly ONLINE_SET = 'chat:onlineUsers';
  private readonly TYPING_SET = 'chat:typingUsers';

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {}

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

  handleConnection(client: Socket): void {
  async afterInit(server: Server) {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        this.logger.warn(
          '⚠️ REDIS_URL no configurado, usando modo local de Socket.IO',
        );
        return;
      }

      // 🔌 Conectar Redis para Socket.IO (Pub/Sub)
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      server.adapter(createAdapter(pubClient, subClient));

      // ✅ Conectar Redis para manejo de estados (online/escribiendo)
      this.redis = pubClient;
      this.logger.log(
        '🚀 ChatGateway conectado a Redis Pub/Sub y store de estados',
      );
    } catch (err) {
      this.logger.error('❌ Error al conectar Redis Pub/Sub:', err);
    }
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

      // ✅ Guardar en memoria local y Redis
      this.onlineUsers.set(userId, client.id);
      await this.redis.sadd(this.ONLINE_SET, userId);

      // ✅ Emitir lista actualizada a todos
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

    // 🧹 Eliminar de memoria local y Redis
    this.onlineUsers.delete(userId);
    await this.redis.srem(this.ONLINE_SET, userId);

    // 🚀 Emitir lista sincronizada
    await this.broadcastOnlineUsers();

    this.logger.log(`🔴 Usuario desconectado: ${userId}`);
  }

  private findUserIdBySocket(socketId: string): string | undefined {
    for (const [userId, id] of this.onlineUsers.entries()) {
      if (id === socketId) return userId;
    }
    return undefined;
  }

  private broadcastOnlineUsers(): void {
    const users = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineUsers', users);
  }

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

  private registerEventListeners(): void {
    const dispatcher = this
      .eventDispatcher as unknown as EventDispatcherWithEmitter;
    const emitter = dispatcher.emitter;

    safeOn<{ groupId: string; message: Message }>(
      'group.message.created',
      ({ groupId, message }) => {
        this.server.to(groupId).emit('messageReceived', message); // unificado
      },
    );

    safeOn<{
      groupId: string;
      name: string;
      imageUrl?: string;
      members: string[];
    }>('group.created', ({ groupId, name, imageUrl, members }) => {
      for (const userId of members) {
        const socketId = this.onlineUsers.get(userId);
        if (socketId) {
          this.server
            .to(socketId)
            .emit('groupCreated', { groupId, name, imageUrl, members });
        }
      }
    });

    emitter.on('group.created', (payload) => {
      const data = payload as {
        groupId: string;
        name: string;
        imageUrl?: string;
        members: string[];
      };
      this.server.emit('groupCreated', data);
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

  emitNewMessage(message: Message): void {
    const conversationId = message.conversation?.id;
    if (!conversationId) return;

    this.server.to(conversationId).emit('newMessage', message);
  }
}
