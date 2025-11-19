import { Module } from '@nestjs/common';
import { RedisMetricsService } from './redis-metrics.service';
import { EnhancedRedisModule } from './enhanced-redis.module';

@Module({
  imports: [EnhancedRedisModule],
  providers: [RedisMetricsService],
  exports: [RedisMetricsService],
})
export class RedisMetricsModule {}
