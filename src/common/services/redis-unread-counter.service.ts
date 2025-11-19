import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';

interface UnreadUpdate {
  userId: string;
  conversationId: string;
  delta: number;
}

@Injectable()
export class RedisUnreadCounterService {
  private readonly logger = new Logger(RedisUnreadCounterService.name);
  private redis: Redis | null = null;

  private readonly ZSET_PREFIX = 'zset:unread';

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getRedis();
  }

  private getKey(userId: string, type: 'dm' | 'group'): string {
    return `${this.ZSET_PREFIX}:${type}:${userId}`;
  }

  async increment(
    userId: string,
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
    delta: number = 1,
  ): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const score = await this.redis.zincrby(key, delta, conversationId);
      return parseInt(score, 10);
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZINCRBY',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async decrement(
    userId: string,
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
    delta: number = 1,
  ): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const score = await this.redis.zincrby(key, -delta, conversationId);
      const numericScore = parseInt(score, 10);

      if (numericScore <= 0) {
        await this.redis.zrem(key, conversationId);
        return 0;
      }

      return numericScore;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZINCRBY',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async set(
    userId: string,
    conversationId: string,
    count: number,
    type: 'dm' | 'group' = 'dm',
  ): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);

      if (count <= 0) {
        await this.redis.zrem(key, conversationId);
        return 0;
      }

      await this.redis.zadd(key, count, conversationId);
      return count;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZADD',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async get(
    userId: string,
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const score = await this.redis.zscore(key, conversationId);
      return score ? parseInt(score, 10) : 0;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZSCORE',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async getAll(
    userId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<Map<string, number>> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const members = await this.redis.zrange(key, 0, -1, 'WITHSCORES');

      const result = new Map<string, number>();
      for (let i = 0; i < members.length; i += 2) {
        const conversationId = members[i];
        const score = parseInt(members[i + 1], 10);
        result.set(conversationId, score);
      }

      return result;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZRANGE',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async clear(
    userId: string,
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<boolean> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const result = await this.redis.zrem(key, conversationId);
      return result > 0;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZREM',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async clearAll(
    userId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<boolean> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'DEL',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async getTotalUnread(
    userId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = this.getKey(userId, type);
      const members = await this.redis.zrange(key, 0, -1, 'WITHSCORES');

      let total = 0;
      for (let i = 1; i < members.length; i += 2) {
        total += parseInt(members[i], 10);
      }

      return total;
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'ZRANGE',
        this.getKey(userId, type),
        error as Error,
      );
    }
  }

  async batchIncrement(
    updates: UnreadUpdate[],
    type: 'dm' | 'group' = 'dm',
  ): Promise<void> {
    if (!this.redis) throw RedisException.redisUnavailable();

    if (updates.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();

      for (const update of updates) {
        const key = this.getKey(update.userId, type);
        pipeline.zincrby(key, update.delta, update.conversationId);
      }

      await pipeline.exec();
    } catch (error) {
      throw RedisException.sortedSetOperationFailed(
        'PIPELINE',
        'multiple',
        error as Error,
      );
    }
  }
}
