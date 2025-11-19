import { Test, TestingModule } from '@nestjs/testing';
import { RedisRateLimitService } from './redis-rate-limit.service';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';

describe('RedisRateLimitService', () => {
  let service: RedisRateLimitService;
  let mockRedis: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockRedisService: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    mockRedis = {
      zremrangebyscore: jest.fn(),
      zcard: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      zrange: jest.fn(),
      del: jest.fn(),
    };

    mockRedisService = {
      getRedis: jest.fn().mockReturnValue(mockRedis),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisRateLimitService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RedisRateLimitService>(RedisRateLimitService);
  });

  describe('checkLimit', () => {
    it('should allow request if under limit', async () => {
      const now = Date.now();
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zcard.mockResolvedValue(3);
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const result = await service.checkLimit('user:123', {
        maxRequests: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(6); // 10 - 4 (3 + new one)
    });

    it('should deny request if at limit', async () => {
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zcard.mockResolvedValue(10); // Already at limit
      mockRedis.zrange.mockResolvedValue(['1000', '2000']); // Oldest timestamps

      const result = await service.checkLimit('user:123', {
        maxRequests: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should clear old requests outside window', async () => {
      const oneHourAgo = Date.now() - 3600000;
      mockRedis.zremrangebyscore.mockResolvedValue(5); // Removed 5 old entries
      mockRedis.zcard.mockResolvedValue(2);
      mockRedis.zadd.mockResolvedValue(1);

      const result = await service.checkLimit('user:123', {
        maxRequests: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(true);
      // Should have called zremrangebyscore to clean old entries
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
    });

    it('should throw RedisException if Redis unavailable', async () => {
      mockRedisService.getRedis.mockReturnValue(null);
      const newService = new RedisRateLimitService(mockRedisService);

      await expect(
        newService.checkLimit('user:123', {
          maxRequests: 10,
          windowSeconds: 60,
        }),
      ).rejects.toThrow(RedisException);
    });

    it('should calculate retryAfter in seconds', async () => {
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zcard.mockResolvedValue(10);
      mockRedis.zrange.mockResolvedValue([String(Date.now() - 5000)]); // 5 seconds ago

      const result = await service.checkLimit('user:123', {
        maxRequests: 10,
        windowSeconds: 60,
      });

      expect(result.retryAfter).toBeGreaterThan(50);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return remaining requests without incrementing', async () => {
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zcard.mockResolvedValue(3);

      const remaining = await service.getRemainingRequests('user:123', {
        maxRequests: 10,
        windowSeconds: 60,
      });

      expect(remaining).toBe(7); // 10 - 3
      // Should not have called zadd (no increment)
      expect(mockRedis.zadd).not.toHaveBeenCalled();
    });

    it('should return 0 if at limit', async () => {
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.zcard.mockResolvedValue(10);

      const remaining = await service.getRemainingRequests('user:123', {
        maxRequests: 10,
        windowSeconds: 60,
      });

      expect(remaining).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset limit for identifier', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.reset('user:123');

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('user:123'),
      );
    });
  });

  describe('resetBatch', () => {
    it('should reset limits for multiple identifiers', async () => {
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([1, 1, 1]),
      };
      mockRedis.pipeline = jest.fn().mockReturnValue(mockPipeline);

      const identifiers = ['user:1', 'user:2', 'user:3'];
      await service.resetBatch(identifiers);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.del).toHaveBeenCalledTimes(3);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle empty batch', async () => {
      await service.resetBatch([]);
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });
  });

  describe('getResetTime', () => {
    it('should return timestamp when limit resets', async () => {
      const _now = Date.now();
      const oldestTimestamp = _now - 30000; // 30 seconds ago
      mockRedis.zrange.mockResolvedValue([String(oldestTimestamp)]);

      const resetTime = await service.getResetTime('user:123');

      // Reset time should be a valid date
      expect(resetTime).toBeInstanceOf(Date);
      expect(resetTime?.getTime()).toBeGreaterThan(0);
    });

    it('should return null if no requests in window', async () => {
      mockRedis.zrange.mockResolvedValue([]);

      const resetTime = await service.getResetTime('user:123');

      // If no requests, should return null
      expect(resetTime).toBeNull();
    });
  });
});
