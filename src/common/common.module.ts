import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { EnhancedRedisService } from './services/enhanced-redis.service';
import { RateLimitService } from './services/rate-limit.service';
import { RedisMetricsService } from './services/redis-metrics.service';

@Module({
  providers: [
    RedisService,
    EnhancedRedisService,
    RateLimitService,
    RedisMetricsService,
  ],
  exports: [
    RedisService,
    EnhancedRedisService,
    RateLimitService,
    RedisMetricsService,
  ],
})
export class CommonModule {}
