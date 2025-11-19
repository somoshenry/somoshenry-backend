import { Test, TestingModule } from '@nestjs/testing';
import { RedisPubSubService } from './redis-pubsub.service';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';

describe('RedisPubSubService', () => {
  let service: RedisPubSubService;
  let mockRedisPub: any;
  let mockRedisSub: any;
  let mockRedisService: any;

  beforeEach(async () => {
    mockRedisPub = {
      publish: jest.fn(),
    };

    mockRedisSub = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      on: jest.fn(),
    };

    mockRedisService = {
      getRedisPub: jest.fn().mockReturnValue(mockRedisPub),
      getRedisSub: jest.fn().mockReturnValue(mockRedisSub),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisPubSubService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RedisPubSubService>(RedisPubSubService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('publish', () => {
    it('should publish a message to a channel', async () => {
      const channel = 'test:channel';
      const payload = { id: '1', text: 'hello' };
      mockRedisPub.publish.mockResolvedValue(1);

      await service.publish(channel, payload);

      expect(mockRedisPub.publish).toHaveBeenCalledWith(
        channel,
        JSON.stringify(payload),
      );
    });

    it('should throw RedisException if publish fails', async () => {
      mockRedisPub.publish.mockRejectedValue(new Error('Publish failed'));

      await expect(
        service.publish('test:channel', { data: 'test' }),
      ).rejects.toThrow(RedisException);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to a channel and register handler', async () => {
      const channel = 'test:channel';
      const handler = jest.fn();
      const messageHandler = jest.fn();

      mockRedisSub.on.mockImplementation((event, cb) => {
        if (event === 'message') {
          messageHandler.mockImplementation(cb);
        }
        return mockRedisSub;
      });

      await service.subscribe(channel, handler);

      expect(mockRedisSub.subscribe).toHaveBeenCalledWith(channel);
      expect(mockRedisSub.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
    });

    it('should prevent duplicate subscriptions', async () => {
      const channel = 'test:channel';
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      mockRedisSub.on.mockImplementation((event, cb) => {
        return mockRedisSub;
      });

      await service.subscribe(channel, handler1);
      await service.subscribe(channel, handler2);

      // Second subscription should be prevented (only one subscribe call per channel)
      expect(mockRedisSub.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should throw RedisException on subscribe error', async () => {
      mockRedisSub.subscribe.mockRejectedValue(new Error('Subscribe failed'));

      await expect(
        service.subscribe('test:channel', jest.fn()),
      ).rejects.toThrow(RedisException);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from a channel', async () => {
      const channel = 'test:channel';
      const handler = jest.fn();

      mockRedisSub.on.mockImplementation((event, cb) => {
        return mockRedisSub;
      });

      await service.subscribe(channel, handler);
      await service.unsubscribe(channel);

      expect(mockRedisSub.unsubscribe).toHaveBeenCalledWith(channel);
    });

    it('should not error if unsubscribing from non-existent channel', async () => {
      mockRedisSub.unsubscribe.mockResolvedValue(0);

      await expect(
        service.unsubscribe('nonexistent:channel'),
      ).resolves.not.toThrow();
    });
  });

  describe('isSubscribed', () => {
    it('should return true if subscribed to channel', async () => {
      const channel = 'test:channel';
      const handler = jest.fn();

      mockRedisSub.on.mockImplementation((event, cb) => {
        return mockRedisSub;
      });

      await service.subscribe(channel, handler);
      const result = service.isSubscribed(channel);

      expect(result).toBe(true);
    });

    it('should return false if not subscribed', () => {
      const result = service.isSubscribed('nonexistent:channel');
      expect(result).toBe(false);
    });
  });

  describe('getSubscriptions', () => {
    it('should return list of active subscriptions', async () => {
      const channel1 = 'test:channel:1';
      const channel2 = 'test:channel:2';

      mockRedisSub.on.mockImplementation((event, cb) => {
        return mockRedisSub;
      });

      await service.subscribe(channel1, jest.fn());
      await service.subscribe(channel2, jest.fn());

      const subscriptions = service.getSubscriptions();

      expect(subscriptions).toContain(channel1);
      expect(subscriptions).toContain(channel2);
      expect(subscriptions).toHaveLength(2);
    });
  });
});
