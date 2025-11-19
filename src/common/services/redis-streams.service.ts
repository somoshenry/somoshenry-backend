import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';
import type {
  StreamEntry,
  StreamReadOptions,
  StreamPaginationCursor,
  StreamPaginationResult,
  StreamTruncateOptions,
} from '../types/redis-stream.types';

@Injectable()
export class RedisStreamService {
  private readonly logger = new Logger(RedisStreamService.name);
  private redis: Redis | null = null;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getRedis();
  }

  async add<T extends Record<string, unknown>>(
    key: string,
    data: T,
    id?: string,
  ): Promise<string> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const serialized = this.serializeEntry(data);
      const streamId = await this.redis.xadd(
        key,
        id ?? '*',
        ...Object.entries(serialized).flat(),
      );

      if (!streamId) {
        throw new Error('Failed to generate stream ID');
      }

      return streamId;
    } catch (error) {
      throw RedisException.streamOperationFailed('XADD', key, error as Error);
    }
  }

  async read<T = Record<string, unknown>>(
    key: string,
    startId: string = '0',
    options?: StreamReadOptions,
  ): Promise<StreamEntry<T>[]> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const args: Array<string | number> = [key, startId];

      if (options?.count) {
        args.push('COUNT', options.count);
      }

      if (options?.block) {
        args.push('BLOCK', options.block);
      }

      const countArgs = options?.count
        ? (['COUNT', options.count.toString()] as const)
        : ([] as const);
      const blockArgs = options?.block
        ? (['BLOCK', options.block.toString()] as const)
        : ([] as const);

      const results = await (
        this.redis.xread as unknown as (
          ...args: string[]
        ) => Promise<Array<[string, Array<[string, string[]]>]> | null>
      )(key, startId, ...countArgs, ...blockArgs);

      if (!results || results.length === 0) {
        return [];
      }

      return results[0][1].map(([id, fields]) => ({
        id,
        data: this.deserializeEntry<T>(fields),
      }));
    } catch (error) {
      throw RedisException.streamOperationFailed('XREAD', key, error as Error);
    }
  }

  async readBackward<T = Record<string, unknown>>(
    key: string,
    startId: string = '+',
    count: number = 50,
  ): Promise<StreamEntry<T>[]> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const results = await this.redis.xrevrange(
        key,
        startId,
        '-',
        'COUNT',
        count,
      );

      return results.map(([id, fields]) => ({
        id,
        data: this.deserializeEntry<T>(fields),
      }));
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'XREVRANGE',
        key,
        error as Error,
      );
    }
  }

  async paginate<T = Record<string, unknown>>(
    key: string,
    page: number = 1,
    pageSize: number = 50,
    backward: boolean = true,
  ): Promise<StreamPaginationResult<T>> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      const offset = (page - 1) * pageSize;
      const startId = backward ? '+' : '0';

      const entries = backward
        ? await this.readBackward<T>(key, startId, offset + pageSize)
        : await this.read<T>(key, startId, { count: offset + pageSize });

      const sliced = entries.slice(offset, offset + pageSize);
      const hasMore = entries.length > offset + pageSize;

      const cursor: StreamPaginationCursor = {
        id: sliced.length > 0 ? sliced[sliced.length - 1].id : '0',
        isInitial: page === 1,
      };

      return {
        entries: sliced,
        cursor,
        hasMore,
      };
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'PAGINATE',
        key,
        error as Error,
      );
    }
  }

  async paginateFromCursor<T = Record<string, unknown>>(
    key: string,
    cursor: StreamPaginationCursor,
    pageSize: number = 50,
    backward: boolean = true,
  ): Promise<StreamPaginationResult<T>> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      let nextId = cursor.id;
      if (!cursor.isInitial) {
        nextId = backward ? `(${cursor.id}` : `(${cursor.id}`;
      }

      const startId = backward ? '+' : '0';
      let entries: StreamEntry<T>[] = [];

      if (cursor.isInitial) {
        entries = backward
          ? await this.readBackward<T>(key, startId, pageSize)
          : await this.read<T>(key, startId, { count: pageSize });
      } else {
        entries = backward
          ? await this.redis
              .xrevrange(key, nextId, '-', 'COUNT', pageSize + 1)
              .then((results) =>
                results.map(([id, fields]) => ({
                  id,
                  data: this.deserializeEntry<T>(fields),
                })),
              )
          : await this.redis
              .xrange(key, nextId, '+', 'COUNT', pageSize + 1)
              .then((results) =>
                results.map(([id, fields]) => ({
                  id,
                  data: this.deserializeEntry<T>(fields),
                })),
              );
      }

      const sliced = entries.slice(0, pageSize);
      const hasMore = entries.length > pageSize;

      const nextCursor: StreamPaginationCursor = {
        id: sliced.length > 0 ? sliced[sliced.length - 1].id : cursor.id,
        isInitial: false,
      };

      return {
        entries: sliced,
        cursor: nextCursor,
        hasMore,
      };
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'XREVRANGE/XRANGE',
        key,
        error as Error,
      );
    }
  }

  async len(key: string): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      return await this.redis.xlen(key);
    } catch (error) {
      throw RedisException.streamOperationFailed('XLEN', key, error as Error);
    }
  }

  async delete(key: string, streamId: string): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      return await this.redis.xdel(key, streamId);
    } catch (error) {
      throw RedisException.streamOperationFailed('XDEL', key, error as Error);
    }
  }

  async truncate(key: string, options: StreamTruncateOptions): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      if (options.approximate) {
        return await (
          this.redis.xtrim as unknown as (
            key: string,
            mode: string,
            limit: string,
            count: number,
          ) => Promise<number>
        )(key, 'MAXLEN', '~', options.maxlen ?? 10000);
      }

      return await (
        this.redis.xtrim as unknown as (
          key: string,
          mode: string,
          limit: number,
        ) => Promise<number>
      )(key, 'MAXLEN', options.maxlen ?? 10000);
    } catch (error) {
      throw RedisException.streamOperationFailed('XTRIM', key, error as Error);
    }
  }

  async deleteStream(key: string): Promise<number> {
    if (!this.redis) throw RedisException.redisUnavailable();

    try {
      return await this.redis.del(key);
    } catch (error) {
      throw RedisException.streamOperationFailed('DEL', key, error as Error);
    }
  }

  private serializeEntry(
    data: Record<string, unknown>,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'string') {
        result[key] = value;
      } else {
        result[key] = JSON.stringify(value);
      }
    }

    return result;
  }

  private deserializeEntry<T = Record<string, unknown>>(fields: string[]): T {
    const result: Record<string, unknown> = {};

    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];

      if (!value || value === '') {
        result[key] = null;
      } else if (value === 'true') {
        result[key] = true;
      } else if (value === 'false') {
        result[key] = false;
      } else {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }
    }

    return result as T;
  }
}
