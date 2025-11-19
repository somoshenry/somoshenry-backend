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

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
      this.recordError();
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
      this.healthState.healthy = true;
      this.healthState.consecutiveFailures = 0;
    });
  }

  async onModuleInit(): Promise<void> {
    await this.redis.ping();
    this.logger.log('Redis initialized');
    this.startHealthCheck();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const latency = Date.now() - startTime;

      this.healthState.healthy = true;
      this.healthState.consecutiveFailures = 0;
      this.healthState.lastCheck = Date.now();

      if (this.metrics.fallbackActive) {
        this.logger.log('✅ Redis recovered from fallback mode');
        this.metrics.fallbackActive = false;
      }

      this.recordLatency(latency);
    } catch (error) {
      this.healthState.consecutiveFailures++;
      this.logger.warn(
        `Health check failed (${this.healthState.consecutiveFailures}/${this.HEALTH_FAILURE_THRESHOLD}): ${error}`,
      );

      if (
        this.healthState.consecutiveFailures >= this.HEALTH_FAILURE_THRESHOLD
      ) {
        this.healthState.healthy = false;
        this.metrics.fallbackActive = true;
        this.logger.error('⚠️  Fallback mode ENABLED - Using local cache');
      }
    }
  }

  private async compressData(data: string): Promise<Buffer> {
    return gzip(Buffer.from(data));
  }

  private async decompressData(data: Buffer): Promise<string> {
    const decompressed = await gunzip(data);
    return decompressed.toString('utf-8');
  }

  async setWithDynamicTTL<T>(
    key: string,
    value: T,
    context?: CacheContext,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const ctx = context || CONTEXT_FROM_KEY(key);
      const ttl = TTL_CONFIG[ctx];
      const serialized = JSON.stringify(value);
      const compressed = serialized.length > this.COMPRESSION_THRESHOLD;

      let dataToStore: string;
      if (compressed) {
        const compressedBuffer = await this.compressData(serialized);
        dataToStore = JSON.stringify({
          __compressed: true,
          data: compressedBuffer.toString('base64'),
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
          compressed,
          timestamp: Date.now() + ttl * 1000,
        });
        this.maintainFallbackCacheSize();
        this.logger.debug(`[FALLBACK] SET ${key} TTL=${ttl}s`);
      } else {
        await this.redis.setex(key, ttl, dataToStore);
      }

      this.recordOperation(Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error}`);
      this.recordError();

      if (!this.metrics.fallbackActive) {
        this.fallbackCache.set(key, {
          data: value,
          compressed: false,
          timestamp: Date.now() + TTL_CONFIG[context || 'default'] * 1000,
        });
      }
    }
  }

  async getWithFallback<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive) {
        const entry = this.fallbackCache.get(key);
        if (entry && entry.timestamp > Date.now()) {
          this.recordOperation(Date.now() - startTime);
          return entry.data as T;
        }
        if (entry) this.fallbackCache.delete(key);
        return null;
      }

      const data = await this.redis.getBuffer(key);
      if (!data) {
        this.recordOperation(Date.now() - startTime);
        return null;
      }

      const parsed = JSON.parse(data.toString('utf-8'));

      if (parsed.__compressed) {
        const decompressed = await this.decompressData(
          Buffer.from(parsed.data, 'base64'),
        );
        this.recordOperation(Date.now() - startTime);
        return JSON.parse(decompressed) as T;
      }

      this.recordOperation(Date.now() - startTime);
      return JSON.parse(parsed.data) as T;
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error}`);
      this.recordError();

      const fallbackEntry = this.fallbackCache.get(key);
      if (fallbackEntry && fallbackEntry.timestamp > Date.now()) {
        return fallbackEntry.data as T;
      }

      return null;
    }
  }

  async del(...keys: string[]): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive) {
        keys.forEach((key) => this.fallbackCache.delete(key));
        this.recordOperation(Date.now() - startTime);
        return keys.length;
      }

      const result = await this.redis.del(...keys);
      keys.forEach((key) => this.fallbackCache.delete(key));
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting keys: ${error}`);
      this.recordError();
      keys.forEach((key) => this.fallbackCache.delete(key));
      return 0;
    }
  }

  async exists(...keys: string[]): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive) {
        const count = keys.filter(
          (key) =>
            this.fallbackCache.has(key) &&
            (this.fallbackCache.get(key)?.timestamp || 0) > Date.now(),
        ).length;
        this.recordOperation(Date.now() - startTime);
        return count;
      }

      const result = await this.redis.exists(...keys);
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error checking existence: ${error}`);
      this.recordError();
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive) {
        const entry = this.fallbackCache.get(key);
        if (entry) {
          entry.timestamp = Date.now() + seconds * 1000;
        }
        this.recordOperation(Date.now() - startTime);
        return entry ? 1 : 0;
      }

      const result = await this.redis.expire(key, seconds);
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error expiring key ${key}: ${error}`);
      this.recordError();
      return 0;
    }
  }

  async lpush(key: string, ...values: (string | number)[]): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive) {
        const list = (this.fallbackCache.get(key)?.data as unknown[]) || [];
        list.push(...values);
        this.fallbackCache.set(key, {
          data: list,
          compressed: false,
          timestamp: Date.now() + TTL_CONFIG.default * 1000,
        });
        this.maintainFallbackCacheSize();
        this.recordOperation(Date.now() - startTime);
        return list.length;
      }

      const result = await this.redis.lpush(
        key,
        ...values.map((v) => String(v)),
      );
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error lpush to ${key}: ${error}`);
      this.recordError();
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive) {
        const list = (
          (this.fallbackCache.get(key)?.data as unknown[]) || []
        ).map((v) => String(v));
        this.recordOperation(Date.now() - startTime);
        return list.slice(start, stop + 1);
      }

      const result = await this.redis.lrange(key, start, stop);
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error lrange from ${key}: ${error}`);
      this.recordError();
      return [];
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    try {
      if (this.metrics.fallbackActive) {
        this.logger.warn(`[FALLBACK] Publish ignored on channel ${channel}`);
        return 0;
      }

      return await this.redis.publish(channel, message);
    } catch (error) {
      this.logger.error(`Error publishing to ${channel}: ${error}`);
      this.recordError();
      return 0;
    }
  }

  isHealthy(): boolean {
    return this.healthState.healthy;
  }

  getMetrics(): OperationMetrics {
    this.metrics.cacheSize = this.fallbackCache.size;
    this.metrics.compressionRatio = this.calculateCompressionRatio();
    return { ...this.metrics };
  }

  getHealthState(): HealthCheckState {
    return { ...this.healthState };
  }

  private recordOperation(latency: number): void {
    this.metrics.totalOperations++;
    this.recordLatency(latency);
  }

  private recordError(): void {
    this.metrics.totalErrors++;
    this.metrics.errorRate =
      this.metrics.totalErrors / this.metrics.totalOperations || 0;
  }

  private recordLatency(latency: number): void {
    this.latencyHistogram.samples.push(latency);
    if (this.latencyHistogram.samples.length > this.MAX_LATENCY_SAMPLES) {
      this.latencyHistogram.samples.shift();
    }

    const sorted = [...this.latencyHistogram.samples].sort((a, b) => a - b);
    const len = sorted.length;

    this.metrics.latencyP50 = sorted[Math.floor(len * 0.5)] || 0;
    this.metrics.latencyP95 = sorted[Math.floor(len * 0.95)] || 0;
    this.metrics.latencyP99 = sorted[Math.floor(len * 0.99)] || 0;
  }

  private calculateCompressionRatio(): number {
    if (this.metrics.totalOperations === 0) return 0;
    const compressedCount = this.latencyHistogram.samples.length;
    return (compressedCount / this.metrics.totalOperations) * 100;
  }

  private maintainFallbackCacheSize(): void {
    if (this.fallbackCache.size > this.MAX_FALLBACK_SIZE) {
      const entriesToDelete = Math.floor(this.MAX_FALLBACK_SIZE * 0.1);
      const entries = Array.from(this.fallbackCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      for (let i = 0; i < entriesToDelete; i++) {
        this.fallbackCache.delete(entries[i][0]);
      }
    }
  }
}
