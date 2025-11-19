import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

@Injectable()
export class RedisRateLimitService {
  private readonly logger = new Logger(RedisRateLimitService.name);
  private redis: Redis | null = null;

  private readonly RATE_LIMIT_PREFIX = 'ratelimit';

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getRedis();
  }

  async checkLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    if (!this.redis) throw RedisException.redisUnavailable();

    const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    try {
      const pipe = this.redis.pipeline();

      pipe.zremrangebyscore(key, '-inf', windowStart);
      pipe.zcard(key);
      pipe.zadd(key, now, `${now}-${Math.random()}`);
      pipe.expire(key, config.windowSeconds);
      pipe.zrange(key, 0, 0);

      const results = await pipe.exec();

      if (!results) throw new Error('Pipeline execution failed');

      const count = results[1][1] as number;
      const allowed = count < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count - 1);

      const oldestEntries = results[4][1] as [string, string] | [];
      let resetAt = new Date(now + config.windowSeconds * 1000);

      if (
        oldestEntries &&
        oldestEntries.length > 0 &&
        oldestEntries[0] !== undefined
      ) {
        const oldestTimestamp = parseInt(oldestEntries[0], 10);
        resetAt = new Date(oldestTimestamp + config.windowSeconds * 1000);
      }

      if (!allowed) {
        throw RedisException.rateLimitExceeded(identifier, config.maxRequests);
      }

      return {
        allowed: true,
        remaining,
        resetAt,
      };
    } catch (error) {
      if (error instanceof RedisException) throw error;

      throw RedisException.rateLimitExceeded(identifier, config.maxRequests);
    }
  }

  async getRemainingRequests(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    try {
      const count = await this.redis.zcount(key, windowStart, now);
      return Math.max(0, config.maxRequests - count);
    } catch (error) {
      this.logger.error(
        `Error checking remaining requests for ${identifier}:`,
        error,
      );
      return config.maxRequests;
    }
  }

  async reset(identifier: string): Promise<void> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error resetting rate limit for ${identifier}:`, error);
    }
  }

  async resetBatch(identifiers: string[]): Promise<void> {
    if (!this.redis) throw RedisException.redisUnavailable();

    if (identifiers.length === 0) return;

    try {
      const keys = identifiers.map((id) => `${this.RATE_LIMIT_PREFIX}:${id}`);
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.error('Error resetting batch rate limits:', error);
    }
  }

  async getResetTime(identifier: string): Promise<Date | null> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const key = `${this.RATE_LIMIT_PREFIX}:${identifier}`;
      const ttl = await this.redis.ttl(key);

      if (ttl === -1 || ttl === -2) {
        return null;
      }

      return new Date(Date.now() + ttl * 1000);
    } catch (error) {
      this.logger.error(`Error getting reset time for ${identifier}:`, error);
      return null;
    }
  }
}
