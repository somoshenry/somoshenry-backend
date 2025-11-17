import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number;
  nx?: boolean;
  xx?: boolean;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis | null = null;
  private redisPub: Redis | null = null;
  private redisSub: Redis | null = null;

  onModuleInit(): void {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        this.logger.warn('Redis desactivado - REDIS_URL no configurado');
        return;
      }

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redisPub = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
      });

      this.redisSub = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
      });

      // Listeners
      this.redis.on('connect', () => {
        this.logger.log('Redis conectado (cliente principal)');
      });

      this.redis.on('error', (err) => {
        this.logger.error('Error Redis:', err.message);
      });

      this.redisPub.on('connect', () => {
        this.logger.log('Redis Pub conectado');
      });

      this.redisSub.on('connect', () => {
        this.logger.log('Redis Sub conectado');
      });
    } catch (error) {
      this.logger.error('Error inicializando Redis:', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) await this.redis.quit();
    if (this.redisPub) await this.redisPub.quit();
    if (this.redisSub) await this.redisSub.quit();
  }

  // Obtener cliente Redis principal

  getRedis(): Redis | null {
    return this.redis;
  }

  //  Obtener cliente Redis Pub

  getRedisPub(): Redis | null {
    return this.redisPub;
  }

  //Obtener cliente Redis Sub

  getRedisSub(): Redis | null {
    return this.redisSub;
  }

  // Verificar si Redis está disponible

  isConnected(): boolean {
    return this.redis != null && this.redis.status === 'ready';
  }

  // GET: Obtener valor

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error obteniendo clave ${key}:`, error);
      return null;
    }
  }

  //SET: Guardar valor con opcional TTL

  async set(
    key: string,
    value: unknown,
    options?: CacheOptions,
  ): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl || 3600; // 1 hora default

      if (options?.nx) {
        const result = await this.redis.set(key, serialized, 'EX', ttl, 'NX');
        return result === 'OK';
      }

      if (options?.xx) {
        const result = await this.redis.set(key, serialized, 'EX', ttl, 'XX');
        return result === 'OK';
      }

      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      this.logger.error(`Error guardando clave ${key}:`, error);
      return false;
    }
  }

  //Eliminar clave/s

  async del(...keys: string[]): Promise<boolean> {
    if (!this.redis || keys.length === 0) return false;
    try {
      const result = await this.redis.del(...keys);
      return result > 0;
    } catch (error) {
      this.logger.error('Error eliminando claves:', error);
      return false;
    }
  }

  // EXISTS: Verificar si existe clave

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error verificando clave ${key}:`, error);
      return false;
    }
  }

  //HSET: Guardar hash

  async hset(
    key: string,
    field: string,
    value: unknown,
    ttl?: number,
  ): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.hset(key, field, JSON.stringify(value));
      if (ttl) {
        await this.redis.expire(key, ttl);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error en HSET ${key}:${field}:`, error);
      return false;
    }
  }

  //HGET: Obtener valor de hash

  async hget<T = string>(key: string, field: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const value = await this.redis.hget(key, field);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error en HGET ${key}:${field}:`, error);
      return null;
    }
  }

  //HGETALL: Obtener todos los campos de hash

  async hgetall<T = Record<string, unknown>>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.hgetall(key);
      if (Object.keys(data).length === 0) return null;

      const result: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result as T;
    } catch (error) {
      this.logger.error(`Error en HGETALL ${key}:`, error);
      return null;
    }
  }

  // LPUSH: Agregar a lista (principio)

  async lpush(key: string, ...values: unknown[]): Promise<number> {
    if (!this.redis) return 0;
    try {
      const serialized = values.map((v) => JSON.stringify(v));
      return await this.redis.lpush(key, ...serialized);
    } catch (error) {
      this.logger.error(`Error en LPUSH ${key}:`, error);
      return 0;
    }
  }

  //RPUSH: Agregar a lista (final)

  async rpush(key: string, ...values: unknown[]): Promise<number> {
    if (!this.redis) return 0;
    try {
      const serialized = values.map((v) => JSON.stringify(v));
      return await this.redis.rpush(key, ...serialized);
    } catch (error) {
      this.logger.error(`Error en RPUSH ${key}:`, error);
      return 0;
    }
  }

  //LRANGE: Obtener rango de lista

  async lrange<T = unknown>(
    key: string,
    start: number = 0,
    stop: number = -1,
  ): Promise<T[]> {
    if (!this.redis) return [];
    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map((v) => {
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    } catch (error) {
      this.logger.error(`Error en LRANGE ${key}:`, error);
      return [];
    }
  }

  // LLEN: Obtener largo de lista

  async llen(key: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      return await this.redis.llen(key);
    } catch (error) {
      this.logger.error(`Error en LLEN ${key}:`, error);
      return 0;
    }
  }

  // SADD: Agregar a conjunto

  async sadd(key: string, ...members: unknown[]): Promise<number> {
    if (!this.redis) return 0;
    try {
      const serialized = members.map((m) => JSON.stringify(m));
      return await this.redis.sadd(key, ...serialized);
    } catch (error) {
      this.logger.error(`Error en SADD ${key}:`, error);
      return 0;
    }
  }

  // SREM: Remover de conjunto

  async srem(key: string, ...members: unknown[]): Promise<number> {
    if (!this.redis) return 0;
    try {
      const serialized = members.map((m) => JSON.stringify(m));
      return await this.redis.srem(key, ...serialized);
    } catch (error) {
      this.logger.error(`Error en SREM ${key}:`, error);
      return 0;
    }
  }

  //SMEMBERS: Obtener todos los miembros de conjunto

  async smembers<T = unknown>(key: string): Promise<T[]> {
    if (!this.redis) return [];
    try {
      const members = await this.redis.smembers(key);
      return members.map((m) => {
        try {
          return JSON.parse(m) as T;
        } catch {
          return m as T;
        }
      });
    } catch (error) {
      this.logger.error(`Error en SMEMBERS ${key}:`, error);
      return [];
    }
  }

  //SCARD: Contar miembros de conjunto

  async scard(key: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      return await this.redis.scard(key);
    } catch (error) {
      this.logger.error(`Error en SCARD ${key}:`, error);
      return 0;
    }
  }

  //EXPIRE: Establecer TTL

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const result = await this.redis.expire(key, seconds);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error en EXPIRE ${key}:`, error);
      return false;
    }
  }

  //TTL: Obtener tiempo restante

  async ttl(key: string): Promise<number> {
    if (!this.redis) return -2;
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error en TTL ${key}:`, error);
      return -2;
    }
  }

  //PUBLISH: Publicar mensaje

  async publish(channel: string, message: unknown): Promise<number> {
    if (!this.redisPub) return 0;
    try {
      const serialized = JSON.stringify(message);
      return await this.redisPub.publish(channel, serialized);
    } catch (error) {
      this.logger.error(`Error publicando en ${channel}:`, error);
      return 0;
    }
  }

  // SUBSCRIBE: Suscribirse a canal

  async subscribe(
    channel: string,
    handler: (message: unknown) => void,
  ): Promise<void> {
    if (!this.redisSub) return;
    try {
      await this.redisSub.subscribe(channel);
      this.redisSub.on('message', (ch, msg) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(msg) as unknown;
            handler(parsed);
          } catch {
            // Si no se puede parsear como JSON, enviar el mensaje como está
            handler(msg);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error suscribiendo a ${channel}:`, error);
    }
  }

  //FLUSHALL: Limpiar toda la BD (desarrollo)

  async flushall(): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.flushall();
      this.logger.warn('Redis flusheado (FLUSHALL)');
      return true;
    } catch (error) {
      this.logger.error('Error en FLUSHALL:', error);
      return false;
    }
  }
}
