import { Test, TestingModule } from '@nestjs/testing';
import { RedisStreamService } from './redis-streams.service';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';
import type { StreamEntry } from '../types/redis-stream.types';

describe('RedisStreamService', () => {
  let service: RedisStreamService;
  let mockRedis: any;
  let mockRedisService: any;

  beforeEach(async () => {
    // Mock Redis client
    mockRedis = {
      xadd: jest.fn(),
      xread: jest.fn(),
      xrevrange: jest.fn(),
      xtrim: jest.fn(),
      xlen: jest.fn(),
      xdel: jest.fn(),
      del: jest.fn(),
    };

    mockRedisService = {
      getRedis: jest.fn().mockReturnValue(mockRedis),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisStreamService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RedisStreamService>(RedisStreamService);
  });

  describe('add', () => {
    it('should add a message to the stream', async () => {
      const key = 'test:stream';
      const data = { id: '1', message: 'hello' };
      mockRedis.xadd.mockResolvedValue('1234567890-0');

      const result = await service.add(key, data);

      expect(result).toBe('1234567890-0');
      expect(mockRedis.xadd).toHaveBeenCalledWith(
        key,
        '*',
        'data',
        JSON.stringify(data),
      );
    });

    it('should trim stream to max length', async () => {
      const key = 'test:stream';
      const data = { id: '1', message: 'hello' };
      mockRedis.xadd.mockResolvedValue('1234567890-0');
      mockRedis.xtrim.mockResolvedValue(1);

      await service.add(key, data, { maxlen: 10000, approximate: true });

      expect(mockRedis.xtrim).toHaveBeenCalled();
    });

    it('should throw RedisException if Redis is unavailable', async () => {
      mockRedisService.getRedis.mockReturnValue(null);
      const newService = new RedisStreamService(mockRedisService);

      await expect(
        newService.add('test:stream', { data: 'test' }),
      ).rejects.toThrow(RedisException);
    });

    it('should throw RedisException on Redis error', async () => {
      mockRedis.xadd.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        service.add('test:stream', { data: 'test' }),
      ).rejects.toThrow(RedisException);
    });
  });

  describe('read', () => {
    it('should read entries from stream', async () => {
      const key = 'test:stream';
      mockRedis.xread.mockResolvedValue([
        [
          key,
          [
            ['1234567890-0', ['data', '{"id":"1","msg":"hello"}']],
            ['1234567890-1', ['data', '{"id":"2","msg":"world"}']],
          ],
        ],
      ]);

      const result = await service.read(key, '0');

      expect(result).toHaveLength(2);
      expect(result[0].data.id).toBe('1');
      expect(result[1].data.id).toBe('2');
    });

    it('should handle empty stream', async () => {
      mockRedis.xread.mockResolvedValue(null);

      const result = await service.read('test:stream', '0');

      expect(result).toEqual([]);
    });

    it('should throw RedisException on error', async () => {
      mockRedis.xread.mockRejectedValue(new Error('Read failed'));

      await expect(service.read('test:stream', '0')).rejects.toThrow(
        RedisException,
      );
    });
  });

  describe('readBackward', () => {
    it('should read entries in reverse order', async () => {
      const key = 'test:stream';
      mockRedis.xrevrange.mockResolvedValue([
        ['1234567890-2', ['data', '{"id":"3","msg":"latest"}']],
        ['1234567890-1', ['data', '{"id":"2","msg":"middle"}']],
        ['1234567890-0', ['data', '{"id":"1","msg":"first"}']],
      ]);

      const result = await service.readBackward(key, '+', 3);

      expect(result).toHaveLength(3);
      expect(result[0].data.id).toBe('3');
      expect(result[2].data.id).toBe('1');
    });
  });

  describe('len', () => {
    it('should return stream length', async () => {
      mockRedis.xlen.mockResolvedValue(42);

      const result = await service.len('test:stream');

      expect(result).toBe(42);
    });

    it('should return 0 for non-existent stream', async () => {
      mockRedis.xlen.mockResolvedValue(0);

      const result = await service.len('nonexistent');

      expect(result).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete an entry from stream', async () => {
      mockRedis.xdel.mockResolvedValue(1);

      const result = await service.delete('test:stream', '1234567890-0');

      expect(result).toBe(true);
      expect(mockRedis.xdel).toHaveBeenCalledWith(
        'test:stream',
        '1234567890-0',
      );
    });

    it('should return false if entry not found', async () => {
      mockRedis.xdel.mockResolvedValue(0);

      const result = await service.delete('test:stream', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('deleteStream', () => {
    it('should delete entire stream', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await service.deleteStream('test:stream');

      expect(result).toBe(1);
    });
  });

  describe('paginate', () => {
    it('should paginate backward through stream', async () => {
      mockRedis.xlen.mockResolvedValue(100);
      mockRedis.xrevrange.mockResolvedValue([
        ['1234567890-99', ['data', '{"id":"100"}']],
        ['1234567890-98', ['data', '{"id":"99"}']],
      ]);

      const result = await service.paginate('test:stream', 1, 2, true);

      expect(result.entries).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.entries[0].data.id).toBe('100');
    });
  });
});
