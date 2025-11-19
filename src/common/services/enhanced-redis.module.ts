import { Module } from '@nestjs/common';
import { EnhancedRedisService } from './enhanced-redis.service';

@Module({
  providers: [EnhancedRedisService],
  exports: [EnhancedRedisService],
})
export class EnhancedRedisModule {}
