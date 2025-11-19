import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';
import { Post } from './entities/post.entity';

interface FeedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filters?: Record<string, unknown>;
}

interface _FeedResponse {
  data: Post[];
  meta: FeedMeta;
}

/**
 * Servicio de caché para Posts
 * Cachea feeds, búsquedas y posts individuales
 */
@Injectable()
export class PostCacheService {
  private readonly logger = new Logger(PostCacheService.name);

  // Claves de caché
  private readonly FEED_CACHE_PREFIX = 'feed:';
  private readonly SEARCH_CACHE_PREFIX = 'search:';
  private readonly POST_CACHE_PREFIX = 'post:';
  private readonly LIKES_CACHE_PREFIX = 'likes:';
  private readonly DISLIKES_CACHE_PREFIX = 'dislikes:';

  // TTL por defecto (en segundos)
  private readonly FEED_TTL = 5 * 60; // 5 minutos
  private readonly SEARCH_TTL = 10 * 60; // 10 minutos
  private readonly POST_TTL = 15 * 60; // 15 minutos
  private readonly STATS_TTL = 1 * 60; // 1 minuto

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generar clave única para caché de feed
   */
  private getFeedCacheKey(
    page: number,
    limit: number,
    type?: string,
    userId?: string,
  ): string {
    const params = [page, limit, type || 'all', userId || 'any'];
    return `${this.FEED_CACHE_PREFIX}${params.join(':')}`;
  }

  /**
   * Generar clave única para búsqueda
   */
  private getSearchCacheKey(
    search: string,
    page: number,
    limit: number,
  ): string {
    return `${this.SEARCH_CACHE_PREFIX}${search}:${page}:${limit}`;
  }

  /**
   * Cachear feed
   */
  async cacheFeed(
    page: number,
    limit: number,
    data: { data: Post[]; meta: FeedMeta },
    type?: string,
    userId?: string,
  ): Promise<boolean> {
    const key = this.getFeedCacheKey(page, limit, type, userId);
    return this.redisService.set(key, data, { ttl: this.FEED_TTL });
  }

  /**
   * Obtener feed del caché
   */
  async getFeedCache(
    page: number,
    limit: number,
    type?: string,
    userId?: string,
  ): Promise<{ data: Post[]; meta: FeedMeta } | null> {
    const key = this.getFeedCacheKey(page, limit, type, userId);
    return this.redisService.get<{ data: Post[]; meta: FeedMeta }>(key);
  }

  /**
   * Cachear búsqueda de posts
   */
  async cacheSearch(
    search: string,
    page: number,
    limit: number,
    data: { data: Post[]; meta: FeedMeta },
  ): Promise<boolean> {
    const key = this.getSearchCacheKey(search, page, limit);
    return this.redisService.set(key, data, { ttl: this.SEARCH_TTL });
  }

  /**
   * Obtener búsqueda del caché
   */
  async getSearchCache(
    search: string,
    page: number,
    limit: number,
  ): Promise<{ data: Post[]; meta: FeedMeta } | null> {
    const key = this.getSearchCacheKey(search, page, limit);
    return this.redisService.get<{ data: Post[]; meta: FeedMeta }>(key);
  }

  /**
   * Cachear post individual
   */
  async cachePost(postId: string, post: Post): Promise<boolean> {
    const key = `${this.POST_CACHE_PREFIX}${postId}`;
    return this.redisService.set(key, post, { ttl: this.POST_TTL });
  }

  /**
   * Obtener post del caché
   */
  async getPostCache(postId: string): Promise<Post | null> {
    const key = `${this.POST_CACHE_PREFIX}${postId}`;
    return this.redisService.get<Post>(key);
  }

  /**
   * Cachear contador de likes
   */
  async cacheLikesCount(postId: string, count: number): Promise<boolean> {
    const key = `${this.LIKES_CACHE_PREFIX}${postId}`;
    return this.redisService.set(key, count, { ttl: this.STATS_TTL });
  }

  /**
   * Obtener contador de likes del caché
   */
  async getLikesCountCache(postId: string): Promise<number | null> {
    const key = `${this.LIKES_CACHE_PREFIX}${postId}`;
    return this.redisService.get<number>(key);
  }

  /**
   * Cachear contador de dislikes
   */
  async cacheDislikesCount(postId: string, count: number): Promise<boolean> {
    const key = `${this.DISLIKES_CACHE_PREFIX}${postId}`;
    return this.redisService.set(key, count, { ttl: this.STATS_TTL });
  }

  /**
   * Obtener contador de dislikes del caché
   */
  async getDislikesCountCache(postId: string): Promise<number | null> {
    const key = `${this.DISLIKES_CACHE_PREFIX}${postId}`;
    return this.redisService.get<number>(key);
  }

  /**
   * Invalidar caché de feed
   */
  async invalidateFeedCache(type?: string, userId?: string): Promise<boolean> {
    // Invalidar todos los feeds si no hay filtros específicos
    if (!type && !userId) {
      try {
        const redis = this.redisService.getRedis();
        const keys = await redis?.keys(`${this.FEED_CACHE_PREFIX}*`);
        if (keys && keys.length > 0) {
          await this.redisService.del(...keys);
          this.logger.log(` Invalidado caché de feed (${keys.length} claves)`);
          return true;
        }
      } catch (error) {
        this.logger.error('Error invalidando caché de feed:', error);
      }
    }

    return false;
  }

  /**
   * Invalidar caché de búsqueda
   */
  async invalidateSearchCache(search?: string): Promise<boolean> {
    try {
      const pattern = search
        ? `${this.SEARCH_CACHE_PREFIX}${search}:*`
        : `${this.SEARCH_CACHE_PREFIX}*`;

      const redis = this.redisService.getRedis();
      const keys = await redis?.keys(pattern);
      if (keys && keys.length > 0) {
        await this.redisService.del(...keys);
        this.logger.log(
          ` Invalidado caché de búsqueda (${keys.length} claves)`,
        );
        return true;
      }
    } catch (error) {
      this.logger.error('Error invalidando caché de búsqueda:', error);
    }

    return false;
  }

  /**
   * Invalidar caché de post individual
   */
  async invalidatePostCache(postId: string): Promise<boolean> {
    const key = `${this.POST_CACHE_PREFIX}${postId}`;
    return this.redisService.del(key);
  }

  /**
   * Invalidar caché de likes
   */
  async invalidateLikesCache(postId: string): Promise<boolean> {
    const key = `${this.LIKES_CACHE_PREFIX}${postId}`;
    return this.redisService.del(key);
  }

  /**
   * Invalidar caché de dislikes
   */
  async invalidateDislikesCache(postId: string): Promise<boolean> {
    const key = `${this.DISLIKES_CACHE_PREFIX}${postId}`;
    return this.redisService.del(key);
  }

  /**
   * Invalidar caché completo de post (post + likes + dislikes)
   */
  async invalidateCompletePostCache(postId: string): Promise<boolean> {
    await this.invalidatePostCache(postId);
    await this.invalidateLikesCache(postId);
    await this.invalidateDislikesCache(postId);
    await this.invalidateFeedCache();
    return true;
  }
}
