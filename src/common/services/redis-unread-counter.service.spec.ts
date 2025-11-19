import { Test, TestingModule } from '@nestjs/testing';
import { RedisUnreadCounterService } from './redis-unread-counter.service';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';

describe('RedisUnreadCounterService', () => {
  let service: RedisUnreadCounterService;
  let mockRedis: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockRedisService: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    mockRedis = {
      zincrby: jest.fn(),
      zscore: jest.fn(),
      zrange: jest.fn(),
      zrem: jest.fn(),
      del: jest.fn(),
      zadd: jest.fn(),
      zcard: jest.fn(),
      pipeline: jest.fn(),
    };

    mockRedisService = {
      getRedis: jest.fn().mockReturnValue(mockRedis),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisUnreadCounterService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RedisUnreadCounterService>(RedisUnreadCounterService);
  });

  describe('increment', () => {
    it('should increment unread counter for user and conversation', async () => {
      mockRedis.zscore.mockResolvedValue(null);
      mockRedis.zadd.mockResolvedValue(1);

      await service.increment('user:123', 'conv:456', 'dm');

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'zset:unread:dm:user:123',
        1,
        'conv:456',
      );
    });

    it('should use zincrby instead of zadd if counter already exists', async () => {
      mockRedis.zscore.mockResolvedValue(2);
      mockRedis.zincrby.mockResolvedValue(3);

      await service.increment('user:123', 'conv:456', 'dm');

      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        'zset:unread:dm:user:123',
        1,
        'conv:456',
      );
    });

    it('should throw RedisException on error', async () => {
      mockRedis.zscore.mockRejectedValue(new Error('Redis error'));

      await expect(
        service.increment('user:123', 'conv:456', 'dm'),
      ).rejects.toThrow(RedisException);
    });
  });

  describe('decrement', () => {
    it('should decrement unread counter', async () => {
      mockRedis.zincrby.mockResolvedValue(1);

      await service.decrement('user:123', 'conv:456', 'dm');

      expect(mockRedis.zincrby).toHaveBeenCalledWith(
        'zset:unread:dm:user:123',
        -1,
        'conv:456',
      );
    });

    it('should remove counter if it reaches 0 or below', async () => {
      mockRedis.zincrby.mockResolvedValue(0);
      mockRedis.zrem.mockResolvedValue(1);

      await service.decrement('user:123', 'conv:456', 'dm');

      expect(mockRedis.zrem).toHaveBeenCalledWith(
        'zset:unread:dm:user:123',
        'conv:456',
      );
    });
  });

  describe('get', () => {
    it('should return unread count for user and conversation', async () => {
      mockRedis.zscore.mockResolvedValue(5);

      const count = await service.get('user:123', 'conv:456', 'dm');

      expect(count).toBe(5);
    });

    it('should return 0 if no counter exists', async () => {
      mockRedis.zscore.mockResolvedValue(null);

      const count = await service.get('user:123', 'conv:456', 'dm');

      expect(count).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all unread counters for a user', async () => {
      mockRedis.zrange.mockResolvedValue([
        'conv:1',
        '3',
        'conv:2',
        '5',
        'conv:3',
        '1',
      ]);

      const counters = await service.getAll('user:123', 'dm');

      expect(counters.size).toBe(3);
      expect(counters.get('conv:1')).toBe(3);
      expect(counters.get('conv:2')).toBe(5);
      expect(counters.get('conv:3')).toBe(1);
    });

    it('should return empty map if user has no unread counters', async () => {
      mockRedis.zrange.mockResolvedValue([]);

      const counters = await service.getAll('user:123', 'dm');

      expect(counters.size).toBe(0);
    });
  });

  describe('getTotalUnread', () => {
    it('should return sum of all unread counts for a user', async () => {
      mockRedis.zrange.mockResolvedValue([
        'conv:1',
        '3',
        'conv:2',
        '5',
        'conv:3',
        '2',
      ]);

      const total = await service.getTotalUnread('user:123', 'dm');

      expect(total).toBe(10);
    });

    it('should return 0 if user has no unread messages', async () => {
      mockRedis.zrange.mockResolvedValue([]);

      const total = await service.getTotalUnread('user:123', 'dm');

      expect(total).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove counter for specific conversation', async () => {
      mockRedis.zrem.mockResolvedValue(1);

      const result = await service.clear('user:123', 'conv:456', 'dm');

      expect(result).toBe(true);
      expect(mockRedis.zrem).toHaveBeenCalledWith(
        'zset:unread:dm:user:123',
        'conv:456',
      );
    });

    it('should return false if counter did not exist', async () => {
      mockRedis.zrem.mockResolvedValue(0);

      const result = await service.clear('user:123', 'conv:456', 'dm');

      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should remove all counters for a user', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await service.clearAll('user:123', 'dm');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('zset:unread:dm:user:123');
    });
  });

  describe('batchIncrement', () => {
    it('should increment multiple users unread counters in one pipeline', async () => {
      const mockPipeline = {
        zincrby: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([1, 1, 1]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const updates = [
        { userId: 'user:1', conversationId: 'conv:123', delta: 1 },
        { userId: 'user:2', conversationId: 'conv:123', delta: 1 },
        { userId: 'user:3', conversationId: 'conv:123', delta: 1 },
      ];

      await service.batchIncrement(updates, 'group');

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.zincrby).toHaveBeenCalledTimes(3);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle empty updates gracefully', async () => {
      await service.batchIncrement([], 'group');
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });
  });
});
