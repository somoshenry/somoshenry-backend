import { Injectable, Logger } from '@nestjs/common';
import { RateLimitExceededException } from '../exceptions/redis.exceptions';

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private windows: Map<string, RateLimitWindow> = new Map();
  private readonly WINDOW_SIZE = 1000;

  checkLimit(userId: string, limit: number): void {
    const key = `rate-limit:${userId}`;
    const now = Date.now();

    let window = this.windows.get(key);

    if (!window || now >= window.resetAt) {
      window = {
        count: 0,
        resetAt: now + this.WINDOW_SIZE,
      };
      this.windows.set(key, window);
    }

    window.count++;

    if (window.count > limit) {
      this.logger.warn(
        `⚠️  Rate limit exceeded for user ${userId}: ${window.count}/${limit}`,
      );
      throw new RateLimitExceededException(limit, this.WINDOW_SIZE);
    }
  }

  reset(userId: string): void {
    this.windows.delete(`rate-limit:${userId}`);
  }

  getStatus(
    userId: string,
    limit: number,
  ): { count: number; limit: number; remaining: number } {
    const key = `rate-limit:${userId}`;
    const window = this.windows.get(key);

    if (!window || Date.now() >= window.resetAt) {
      return { count: 0, limit, remaining: limit };
    }

    return {
      count: window.count,
      limit,
      remaining: Math.max(0, limit - window.count),
    };
  }

  cleanupExpiredWindows(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, window] of this.windows.entries()) {
      if (now >= window.resetAt) {
        this.windows.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedCount} expired rate limit windows`,
      );
    }
  }
}
