import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { RedisStreamService } from './services/redis-streams.service';
import { RedisPubSubService } from './services/redis-pubsub.service';
import { RedisUnreadCounterService } from './services/redis-unread-counter.service';
import { RedisRateLimitService } from './services/redis-rate-limit.service';

@Module({
  providers: [
    RedisService,
    RedisStreamService,
    RedisPubSubService,
    RedisUnreadCounterService,
    RedisRateLimitService,
  ],
  exports: [
    RedisService,
    RedisStreamService,
    RedisPubSubService,
    RedisUnreadCounterService,
    RedisRateLimitService,
  ],
})
export class CommonModule {}
