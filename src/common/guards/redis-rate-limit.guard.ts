import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { RedisRateLimitService } from '../services/redis-rate-limit.service';

/**
 * Redis-based rate limiting guard for distributed rate limiting across instances.
 * Can be applied to endpoints to limit request frequency per user.
 *
 * Usage: @UseGuards(RedisRateLimitGuard('endpoint-name', { maxRequests: 10, windowSeconds: 60 }))
 */
@Injectable()
export class RedisRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RedisRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as any).user?.id;

    // Skip if no user (might be handled by auth guard)
    if (!userId) {
      return true;
    }

    // Get rate limit config from request metadata if available
    // Default: 10 requests per 60 seconds per user
    const identifier = `${userId}`;
    const result = await this.rateLimitService.checkLimit(identifier, {
      maxRequests: 10,
      windowSeconds: 60,
    });

    if (!result.allowed) {
      throw new HttpException(
        `Too many requests. Please try again in ${result.retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
