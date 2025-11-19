import { Injectable, Logger } from '@nestjs/common';
import { EnhancedRedisService } from './enhanced-redis.service';
import { OperationMetrics, HealthCheckState } from '../types/redis.types';

@Injectable()
export class RedisMetricsService {
  private readonly logger = new Logger(RedisMetricsService.name);

  constructor(private readonly redis: EnhancedRedisService) {}

  getMetrics(): OperationMetrics {
    return this.redis.getMetrics();
  }

  getHealthState(): HealthCheckState {
    return this.redis.getHealthState();
  }

  getFormattedMetrics(): object {
    const metrics = this.redis.getMetrics();
    const health = this.redis.getHealthState();

    return {
      timestamp: new Date().toISOString(),
      redis: {
        healthy: health.healthy,
        fallbackActive: metrics.fallbackActive,
        consecutiveFailures: health.consecutiveFailures,
        lastHealthCheck: new Date(health.lastCheck).toISOString(),
      },
      operations: {
        total: metrics.totalOperations,
        errors: metrics.totalErrors,
        errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
      },
      performance: {
        latencyP50: `${metrics.latencyP50.toFixed(2)}ms`,
        latencyP95: `${metrics.latencyP95.toFixed(2)}ms`,
        latencyP99: `${metrics.latencyP99.toFixed(2)}ms`,
      },
      cache: {
        cacheSize: metrics.cacheSize,
        maxSize: 5000,
        compressionRatio: `${metrics.compressionRatio.toFixed(2)}%`,
      },
    };
  }

  logMetrics(): void {
    const formatted = this.getFormattedMetrics();
    this.logger.log(`📊 Redis Metrics: ${JSON.stringify(formatted, null, 2)}`);
  }
}
