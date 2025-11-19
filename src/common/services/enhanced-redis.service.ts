import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { Redis } from 'ioredis';
import {
  CacheEntry,
  OperationMetrics,
  HealthCheckState,
  CacheContext,
  TTL_CONFIG,
  CONTEXT_FROM_KEY,
} from '../types/redis.types';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface LatencyHistogram {
  samples: number[];
}

@Injectable()
export class EnhancedRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EnhancedRedisService.name);
  private redis: Redis;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private fallbackCache: Map<string, CacheEntry> = new Map();

  private healthState: HealthCheckState = {
    healthy: true,
    consecutiveFailures: 0,
    lastCheck: 0,
    nextCheck: 0,
  };

  private metrics: OperationMetrics = {
    totalOperations: 0,
    totalErrors: 0,
    errorRate: 0,
    latencyP50: 0,
    latencyP95: 0,
    latencyP99: 0,
    fallbackActive: false,
    fallbackDuration: 0,
    compressionRatio: 0,
    cacheSize: 0,
  };

  private latencyHistogram: LatencyHistogram = { samples: [] };

  private readonly COMPRESSION_THRESHOLD = 1024;
  private readonly HEALTH_CHECK_INTERVAL = 10000;
  private readonly HEALTH_FAILURE_THRESHOLD = 3;
  private readonly MAX_FALLBACK_SIZE = 5000;
  private readonly MAX_LATENCY_SAMPLES = 1000;

  private readonly PING_SUPPORTED = process.env.REDIS_SUPPORTS_PING !== 'false';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times) => Math.min(times * 100, 2000),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
      this.recordError();
      this.metrics.fallbackActive = true;
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
      this.metrics.fallbackActive = false;
    });
  }

  async onModuleInit() {
    if (this.PING_SUPPORTED) {
      try {
        await this.redis.ping();
        this.logger.log('Redis PING OK');
      } catch {
        this.logger.warn('PING not supported — Disabling health checks');
        this.PING_SUPPORTED = false;
      }
    }

    if (this.PING_SUPPORTED) {
      this.startHealthCheck();
    } else {
      this.logger.warn(
        'Redis health check disabled (Render Free KV does not support PING)',
      );
    }
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

    try {
      await this.redis.quit();
    } catch {
      // ignore
    }
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthCheck() {
    if (!this.PING_SUPPORTED) return;

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      this.healthState.healthy = true;
      this.healthState.consecutiveFailures = 0;
      this.healthState.lastCheck = Date.now();

      this.metrics.fallbackActive = false;
      this.recordLatency(latency);
    } catch {
      this.healthState.consecutiveFailures++;

      if (
        this.healthState.consecutiveFailures >= this.HEALTH_FAILURE_THRESHOLD
      ) {
        this.healthState.healthy = false;
        this.metrics.fallbackActive = true;
      }
    }
  }

  // ------------------------------ CACHE API ------------------------------

  private async safeGet(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch {
      this.metrics.fallbackActive = true;
      return null;
    }
  }

  async getWithFallback<T>(key: string): Promise<T | null> {
    const start = Date.now();

    if (this.metrics.fallbackActive) {
      const f = this.fallbackCache.get(key);
      if (f && f.timestamp > Date.now()) return f.data as T;
      return null;
    }

    try {
      const raw = await this.safeGet(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (parsed.__compressed) {
        const data = await gunzip(Buffer.from(parsed.data, 'base64'));
        this.recordOperation(Date.now() - start);
        return JSON.parse(data.toString()) as T;
      }

      this.recordOperation(Date.now() - start);
      return JSON.parse(parsed.data) as T;
    } catch (e) {
      this.recordError();
      return null;
    }
  }

  async setWithDynamicTTL<T>(
    key: string,
    value: T,
    context?: CacheContext,
  ): Promise<void> {
    const start = Date.now();

    try {
      const ctx = context || CONTEXT_FROM_KEY(key);
      const ttl = TTL_CONFIG[ctx];

      const serialized = JSON.stringify(value);
      const compress = serialized.length > this.COMPRESSION_THRESHOLD;

      let dataToStore: string;

      if (compress) {
        const zipped = await gzip(Buffer.from(serialized));
        dataToStore = JSON.stringify({
          __compressed: true,
          data: zipped.toString('base64'),
        });
      } else {
        dataToStore = JSON.stringify({
          __compressed: false,
          data: serialized,
        });
      }

      if (this.metrics.fallbackActive) {
        this.fallbackCache.set(key, {
          data: value,
          compressed: compress,
          timestamp: Date.now() + ttl * 1000,
        });
      } else {
        await this.redis.set(key, dataToStore, 'EX', ttl);
      }

      this.recordOperation(Date.now() - start);
    } catch {
      this.metrics.fallbackActive = true;
    }
  }

  // ------------------------------ UTILS ------------------------------

  private recordOperation(latency: number) {
    this.metrics.totalOperations++;
    this.recordLatency(latency);
  }

  private recordError() {
    this.metrics.totalErrors++;
    this.metrics.errorRate =
      this.metrics.totalErrors / (this.metrics.totalOperations || 1);
  }

  private recordLatency(latency: number) {
    this.latencyHistogram.samples.push(latency);

    if (this.latencyHistogram.samples.length > this.MAX_LATENCY_SAMPLES) {
      this.latencyHistogram.samples.shift();
    }

    const sorted = [...this.latencyHistogram.samples].sort((a, b) => a - b);
    const n = sorted.length;

    this.metrics.latencyP50 = sorted[Math.floor(n * 0.5)] || 0;
    this.metrics.latencyP95 = sorted[Math.floor(n * 0.95)] || 0;
    this.metrics.latencyP99 = sorted[Math.floor(n * 0.99)] || 0;
  }

  getMetrics(): OperationMetrics {
    this.metrics.cacheSize = this.fallbackCache.size;
    return { ...this.metrics };
  }

  getHealthState(): HealthCheckState {
    return { ...this.healthState };
  }
}
