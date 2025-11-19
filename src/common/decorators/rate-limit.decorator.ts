import {
  createParamDecorator,
  ExecutionContext,
  UseInterceptors,
  NestInterceptor,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { RateLimitService } from '../services/rate-limit.service';
import { RateLimitExceededException } from '../exceptions/redis.exceptions';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: RateLimitService) {}

  intercept(context: ExecutionContext, next: any) {
    const request = context.switchToHttp().getRequest();
    const socket = context.switchToWs().getClient();

    const userId =
      request?.user?.id ||
      request?.user?.sub ||
      socket?.handshake?.auth?.userId ||
      'anonymous';

    const target = context.getHandler();
    const limit = Reflect.getMetadata('rate-limit', target) || 200;

    try {
      this.rateLimitService.checkLimit(userId, limit);
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        throw new BadRequestException(
          'Too many requests. Please try again later.',
        );
      }
      throw error;
    }

    return next.handle();
  }
}

export const RateLimit = (limit: number = 200) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rate-limit', limit, descriptor.value);
    return descriptor;
  };
};
