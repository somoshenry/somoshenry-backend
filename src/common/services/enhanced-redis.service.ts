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
  private redis: Redis | null = null;
  private redisDisabled = false;

  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Fallback en memoria
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
  private readonly HEALTH_CHECK_INTERVAL = 10_000;
  private readonly HEALTH_FAILURE_THRESHOLD = 3;
  private readonly MAX_FALLBACK_SIZE = 5000;
  private readonly MAX_LATENCY_SAMPLES = 1000;

  constructor() {
    /**
     * Config flexible:
     * - Si DISABLE_REDIS=true O estamos en desarrollo local sin Redis configurado -> Solo fallback
     * - Si hay REDIS_URL -> Render KV / cloud Redis (rediss:// o redis://)
     * - Si no, usamos host/port locales
     */
    const disableRedis =
      process.env.DISABLE_REDIS === 'true' ||
      (process.env.NODE_ENV === 'development' &&
        !process.env.REDIS_URL &&
        !process.env.REDIS_HOST);

    if (disableRedis) {
      this.logger.warn(
        '⚠️ Redis está DESHABILITADO. Usando solo caché en memoria (fallback mode).',
      );
      this.redisDisabled = true;
      this.metrics.fallbackActive = true;
      this.healthState.healthy = false;
      this.redis = null;
      return;
    }

    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      this.logger.log(`Inicializando Redis con REDIS_URL`);
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false, // evita usar INFO que a veces no está soportado en KV
      });
    } else {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      this.logger.log(`Inicializando Redis con host=${host} port=${port}`);

      this.redis = new Redis({
        host,
        port,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
      });
    }

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err?.message || '(sin mensaje)'}`);
      this.recordError();
      // No tiramos la app, solo marcamos fallback
      this.metrics.fallbackActive = true;
      this.healthState.healthy = false;
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
      this.healthState.healthy = true;
      this.healthState.consecutiveFailures = 0;
      this.metrics.fallbackActive = false;
    });
  }

  async onModuleInit(): Promise<void> {
    // Si Redis está deshabilitado, no intentamos conectar
    if (this.redisDisabled || !this.redis) {
      this.logger.log('Redis deshabilitado, usando caché en memoria');
      this.startHealthCheck();
      return;
    }

    // Nunca dejamos que esto rompa el bootstrap
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      this.logger.log(`Redis initialized (ping ${latency} ms)`);
      this.healthState.healthy = true;
      this.metrics.fallbackActive = false;
      this.recordLatency(latency);
    } catch (err) {
      this.logger.warn(
        `Redis NO disponible al iniciar. Arrancando en modo fallback en memoria. Error: ${err}`,
      );
      this.healthState.healthy = false;
      this.metrics.fallbackActive = true;
    }

    this.startHealthCheck();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Si Redis está deshabilitado, no intentamos cerrar conexión
    if (this.redisDisabled || !this.redis) {
      this.logger.log('Redis estaba deshabilitado, limpieza completada');
      return;
    }

    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (err) {
      this.logger.warn(`Error closing Redis connection: ${err}`);
    }
  }

  // =========================
  // Health check
  // =========================
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch((err) => {
        this.logger.warn(`Health check error: ${err}`);
      });
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthCheck(): Promise<void> {
    // Si Redis está deshabilitado, saltamos el health check
    if (this.redisDisabled || !this.redis) {
      return;
    }

    const now = Date.now();
    this.healthState.nextCheck = now + this.HEALTH_CHECK_INTERVAL;

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      this.healthState.healthy = true;
      this.healthState.consecutiveFailures = 0;
      this.healthState.lastCheck = now;

      if (this.metrics.fallbackActive) {
        this.logger.log('Redis se recuperó, saliendo de modo fallback');
      }

      this.metrics.fallbackActive = false;
      this.recordLatency(latency);
    } catch (err) {
      this.healthState.consecutiveFailures++;
      this.healthState.lastCheck = now;

      this.logger.warn(
        `Health check failed (${this.healthState.consecutiveFailures}/${this.HEALTH_FAILURE_THRESHOLD}): ${err}`,
      );

      if (
        this.healthState.consecutiveFailures >= this.HEALTH_FAILURE_THRESHOLD
      ) {
        if (!this.metrics.fallbackActive) {
          this.logger.error('Fallback mode ENABLED - Using local cache');
        }
        this.healthState.healthy = false;
        this.metrics.fallbackActive = true;
      }
    }
  }

  // =========================
  // Compresión
  // =========================
  private async compressData(data: string): Promise<Buffer> {
    return gzip(Buffer.from(data));
  }

  private async decompressData(data: Buffer): Promise<string> {
    const decompressed = await gunzip(data);
    return decompressed.toString('utf-8');
  }

  // =========================
  // API de caché principal
  // =========================
  async setWithDynamicTTL<T>(
    key: string,
    value: T,
    context?: CacheContext,
  ): Promise<void> {
    const startTime = Date.now();
    const ctx = context || CONTEXT_FROM_KEY(key);
    const ttl = TTL_CONFIG[ctx] ?? TTL_CONFIG.default;

    try {
      const serialized = JSON.stringify(value);
      const shouldCompress = serialized.length > this.COMPRESSION_THRESHOLD;

      let dataToStore: string;
      if (shouldCompress) {
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

      if (this.metrics.fallbackActive || !this.redis) {
        // Solo memoria
        this.fallbackCache.set(key, {
          data: value,
          compressed: shouldCompress,
          timestamp: Date.now() + ttl * 1000,
        });
        this.maintainFallbackCacheSize();
        this.logger.debug(`[FALLBACK] SET ${key} TTL=${ttl}s`);
      } else {
        // Redis real
        await this.redis.setex(key, ttl, dataToStore);
      }

      this.recordOperation(Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error}`);
      this.recordError();

      // Guardamos en fallback de todas formas
      this.fallbackCache.set(key, {
        data: value,
        compressed: false,
        timestamp: Date.now() + ttl * 1000,
      });
      this.maintainFallbackCacheSize();
      this.metrics.fallbackActive = true;
    }
  }

  async getWithFallback<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      // Si estamos en modo fallback, consultamos solo memoria
      if (this.metrics.fallbackActive) {
        const entry = this.fallbackCache.get(key);
        if (entry && entry.timestamp > Date.now()) {
          this.recordOperation(Date.now() - startTime);
          return entry.data as T;
        }
        if (entry) this.fallbackCache.delete(key);
        this.recordOperation(Date.now() - startTime);
        return null;
      }

      // Redis
      const buffer = await this.redis!.getBuffer(key);
      if (!buffer) {
        this.recordOperation(Date.now() - startTime);
        return null;
      }

      const wrapper = JSON.parse(buffer.toString('utf-8')) as {
        __compressed: boolean;
        data: string;
      };

      let jsonString: string;
      if (wrapper.__compressed) {
        jsonString = await this.decompressData(
          Buffer.from(wrapper.data, 'base64'),
        );
      } else {
        jsonString = wrapper.data;
      }

      this.recordOperation(Date.now() - startTime);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error}`);
      this.recordError();
      this.metrics.fallbackActive = true;

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
      if (this.metrics.fallbackActive || !this.redis) {
        keys.forEach((k) => this.fallbackCache.delete(k));
        this.recordOperation(Date.now() - startTime);
        return keys.length;
      }

      const result = await this.redis.del(...keys);
      keys.forEach((k) => this.fallbackCache.delete(k));
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting keys: ${error}`);
      this.recordError();
      keys.forEach((k) => this.fallbackCache.delete(k));
      this.metrics.fallbackActive = true;
      return 0;
    }
  }

  async exists(...keys: string[]): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive || !this.redis) {
        const count = keys.filter((key) => {
          const entry = this.fallbackCache.get(key);
          return entry && entry.timestamp > Date.now();
        }).length;
        this.recordOperation(Date.now() - startTime);
        return count;
      }

      const result = await this.redis.exists(...keys);
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error checking existence: ${error}`);
      this.recordError();
      this.metrics.fallbackActive = true;
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive || !this.redis) {
        const entry = this.fallbackCache.get(key);
        if (entry) {
          entry.timestamp = Date.now() + seconds * 1000;
          this.recordOperation(Date.now() - startTime);
          return 1;
        }
        this.recordOperation(Date.now() - startTime);
        return 0;
      }

      const result = await this.redis.expire(key, seconds);
      this.recordOperation(Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Error expiring key ${key}: ${error}`);
      this.recordError();
      this.metrics.fallbackActive = true;
      return 0;
    }
  }

  async lpush(key: string, ...values: (string | number)[]): Promise<number> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive || !this.redis) {
        const list = (this.fallbackCache.get(key)?.data as unknown[]) || [];
        list.unshift(...values);
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
      this.metrics.fallbackActive = true;
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const startTime = Date.now();

    try {
      if (this.metrics.fallbackActive || !this.redis) {
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
      this.metrics.fallbackActive = true;
      return [];
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    try {
      if (this.metrics.fallbackActive || !this.redis) {
        this.logger.warn(`[FALLBACK] Publish ignored on channel ${channel}`);
        return 0;
      }

      return await this.redis.publish(channel, message);
    } catch (error) {
      this.logger.error(`Error publishing to ${channel}: ${error}`);
      this.recordError();
      this.metrics.fallbackActive = true;
      return 0;
    }
  }

  // =========================
  // Métricas / estado
  // =========================
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
      this.metrics.totalErrors / (this.metrics.totalOperations || 1);
  }

  private recordLatency(latency: number): void {
    this.latencyHistogram.samples.push(latency);
    if (this.latencyHistogram.samples.length > this.MAX_LATENCY_SAMPLES) {
      this.latencyHistogram.samples.shift();
    }

    const sorted = [...this.latencyHistogram.samples].sort((a, b) => a - b);
    const len = sorted.length;

    const idx50 = Math.floor(len * 0.5);
    const idx95 = Math.floor(len * 0.95);
    const idx99 = Math.floor(len * 0.99);

    this.metrics.latencyP50 = sorted[idx50] ?? 0;
    this.metrics.latencyP95 = sorted[idx95] ?? 0;
    this.metrics.latencyP99 = sorted[idx99] ?? 0;
  }

  private calculateCompressionRatio(): number {
    // Aquí podrías llevar una métrica real de cuántos SET se comprimen.
    // De momento usamos una aproximación básica.
    if (this.metrics.totalOperations === 0) return 0;
    return (
      (this.latencyHistogram.samples.length / this.metrics.totalOperations) *
      100
    );
  }

  private maintainFallbackCacheSize(): void {
    if (this.fallbackCache.size <= this.MAX_FALLBACK_SIZE) return;

    const entries = Array.from(this.fallbackCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const entriesToDelete = Math.floor(this.MAX_FALLBACK_SIZE * 0.1);

    for (let i = 0; i < entriesToDelete; i++) {
      this.fallbackCache.delete(entries[i][0]);
    }
  }
}
