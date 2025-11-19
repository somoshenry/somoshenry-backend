import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisException } from '../errors/redis.exception';

export type MessageHandler<T = Record<string, unknown>> = (
  payload: T,
) => void | Promise<void>;

interface ChannelSubscription<T = Record<string, unknown>> {
  channel: string;
  handler: MessageHandler<T>;
  redisSub: Redis;
}

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private redisPub: Redis | null = null;
  private subscriptions = new Map<string, ChannelSubscription>();

  constructor(private readonly redisService: RedisService) {
    this.redisPub = this.redisService.getRedisPub();
  }

  async onModuleDestroy(): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      try {
        await subscription.redisSub.unsubscribe(subscription.channel);
        await subscription.redisSub.quit();
      } catch (error) {
        this.logger.error(
          `Error unsubscribing from ${subscription.channel}:`,
          error,
        );
      }
    }
    this.subscriptions.clear();
  }

  async publish<T extends Record<string, unknown>>(
    channel: string,
    message: T,
  ): Promise<number> {
    if (!this.redisPub) {
      this.logger.warn(`Pub/Sub unavailable, skipping publish to ${channel}`);
      return 0;
    }

    try {
      const serialized = JSON.stringify(message);
      const result = await this.redisPub.publish(channel, serialized);
      return result;
    } catch (error) {
      throw RedisException.pubsubPublishFailed(channel, error as Error);
    }
  }

  async subscribe<T extends Record<string, unknown>>(
    channel: string,
    handler: MessageHandler<T>,
  ): Promise<void> {
    if (this.subscriptions.has(channel)) {
      this.logger.warn(`Already subscribed to ${channel}, skipping duplicate`);
      return;
    }

    const redisSub = this.redisService.getRedisSub();
    if (!redisSub) {
      throw RedisException.redisUnavailable();
    }

    try {
      await redisSub.subscribe(channel);

      redisSub.on('message', (ch, msg): void => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(msg) as T;
            void handler(parsed);
          } catch (error) {
            this.logger.error(`Error parsing message on ${channel}:`, error);
          }
        }
      });

      this.subscriptions.set(channel, { channel, handler, redisSub });
      this.logger.log(`Subscribed to ${channel}`);
    } catch (error) {
      throw RedisException.pubsubSubscriptionFailed(channel, error as Error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    const subscription = this.subscriptions.get(channel);
    if (!subscription) {
      this.logger.warn(`Not subscribed to ${channel}, skipping unsubscribe`);
      return;
    }

    try {
      await subscription.redisSub.unsubscribe(channel);
      this.subscriptions.delete(channel);
      this.logger.log(`Unsubscribed from ${channel}`);
    } catch (error) {
      throw RedisException.pubsubSubscriptionFailed(channel, error as Error);
    }
  }

  isSubscribed(channel: string): boolean {
    return this.subscriptions.has(channel);
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}
