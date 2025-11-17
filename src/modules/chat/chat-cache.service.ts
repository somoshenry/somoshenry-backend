import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';
import { Message } from './entities/message.entity';

/**
 * Servicio de caché para Chat
 * Cachea conversaciones, mensajes recientes y miembros de grupo
 */
@Injectable()
export class ChatCacheService {
  private readonly logger = new Logger(ChatCacheService.name);

  // Claves de caché
  private readonly CONVERSATION_MESSAGES_PREFIX = 'chat:conv:';
  private readonly GROUP_MESSAGES_PREFIX = 'chat:group:';
  private readonly GROUP_MEMBERS_PREFIX = 'chat:members:';
  private readonly ONLINE_USERS_KEY = 'chat:onlineUsers';
  private readonly TYPING_USERS_KEY = 'chat:typing:';

  // TTL por defecto (en segundos)
  private readonly MESSAGES_TTL = 30 * 60; // 30 minutos
  private readonly MEMBERS_TTL = 15 * 60; // 15 minutos
  private readonly ONLINE_TTL = 5 * 60; // 5 minutos

  constructor(private readonly redisService: RedisService) {}

  /**
   * Cachear últimos mensajes de conversación 1a1
   */
  async cacheConversationMessages(
    conversationId: string,
    messages: Message[],
  ): Promise<boolean> {
    const key = `${this.CONVERSATION_MESSAGES_PREFIX}${conversationId}`;
    return this.redisService.set(key, messages, { ttl: this.MESSAGES_TTL });
  }

  /**
   * Obtener últimos mensajes de conversación del caché
   */
  async getConversationMessagesCache(
    conversationId: string,
  ): Promise<Message[] | null> {
    const key = `${this.CONVERSATION_MESSAGES_PREFIX}${conversationId}`;
    return this.redisService.get<Message[]>(key);
  }

  /**
   * Cachear últimos mensajes de grupo
   */
  async cacheGroupMessages(
    groupId: string,
    messages: Message[],
  ): Promise<boolean> {
    const key = `${this.GROUP_MESSAGES_PREFIX}${groupId}`;
    return this.redisService.set(key, messages, { ttl: this.MESSAGES_TTL });
  }

  /**
   * Obtener últimos mensajes de grupo del caché
   */
  async getGroupMessagesCache(groupId: string): Promise<Message[] | null> {
    const key = `${this.GROUP_MESSAGES_PREFIX}${groupId}`;
    return this.redisService.get<Message[]>(key);
  }

  /**
   * Cachear miembros de grupo
   */
  async cacheGroupMembers(
    groupId: string,
    members: string[],
  ): Promise<boolean> {
    const key = `${this.GROUP_MEMBERS_PREFIX}${groupId}`;
    return this.redisService.set(key, members, { ttl: this.MEMBERS_TTL });
  }

  /**
   * Obtener miembros de grupo del caché
   */
  async getGroupMembersCache(groupId: string): Promise<string[] | null> {
    const key = `${this.GROUP_MEMBERS_PREFIX}${groupId}`;
    return this.redisService.get<string[]>(key);
  }

  /**
   * Agregar usuario online
   */
  addOnlineUser(userId: string): Promise<boolean> {
    return this.redisService
      .sadd(this.ONLINE_USERS_KEY, userId)
      .then((result) => result > 0);
  }

  /**
   * Remover usuario online
   */
  removeOnlineUser(userId: string): Promise<boolean> {
    return this.redisService
      .srem(this.ONLINE_USERS_KEY, userId)
      .then((result) => result > 0);
  }

  /**
   * Obtener usuarios online
   */
  async getOnlineUsers(): Promise<string[]> {
    return this.redisService.smembers<string>(this.ONLINE_USERS_KEY);
  }

  /**
   * Verificar si usuario está online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const users = await this.getOnlineUsers();
    return users.includes(userId);
  }

  /**
   * Agregar usuario escribiendo
   */
  addTypingUser(conversationId: string, userId: string): Promise<boolean> {
    const key = `${this.TYPING_USERS_KEY}${conversationId}`;
    return this.redisService.sadd(key, userId).then((result) => result > 0);
  }

  /**
   * Remover usuario escribiendo
   */
  removeTypingUser(conversationId: string, userId: string): Promise<boolean> {
    const key = `${this.TYPING_USERS_KEY}${conversationId}`;
    return this.redisService.srem(key, userId).then((result) => result > 0);
  }

  /**
   * Obtener usuarios escribiendo en conversación
   */
  async getTypingUsers(conversationId: string): Promise<string[]> {
    const key = `${this.TYPING_USERS_KEY}${conversationId}`;
    return this.redisService.smembers<string>(key);
  }

  /**
   * Invalidar caché de mensajes de conversación
   */
  async invalidateConversationCache(conversationId: string): Promise<boolean> {
    const key = `${this.CONVERSATION_MESSAGES_PREFIX}${conversationId}`;
    return this.redisService.del(key);
  }

  /**
   * Invalidar caché de mensajes de grupo
   */
  async invalidateGroupMessagesCache(groupId: string): Promise<boolean> {
    const key = `${this.GROUP_MESSAGES_PREFIX}${groupId}`;
    return this.redisService.del(key);
  }

  /**
   * Invalidar caché de miembros de grupo
   */
  async invalidateGroupMembersCache(groupId: string): Promise<boolean> {
    const key = `${this.GROUP_MEMBERS_PREFIX}${groupId}`;
    return this.redisService.del(key);
  }

  /**
   * Invalidar caché completo de grupo
   */
  async invalidateCompleteGroupCache(groupId: string): Promise<boolean> {
    await this.invalidateGroupMessagesCache(groupId);
    await this.invalidateGroupMembersCache(groupId);
    return true;
  }

  /**
   * Limpiar usuarios escribiendo (cuando expira TTL)
   */
  async clearTypingUsers(conversationId: string): Promise<boolean> {
    const key = `${this.TYPING_USERS_KEY}${conversationId}`;
    return this.redisService.del(key);
  }
}
