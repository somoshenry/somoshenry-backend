import { Injectable, Logger } from '@nestjs/common';
import {
  RedisPubSubService,
  MessageHandler,
} from '../../common/services/redis-pubsub.service';
import { RedisException } from '../../common/errors/redis.exception';

export interface DirectMessagePayload {
  type: 'message.sent' | 'message.read' | 'typing';
  conversationId: string;
  senderId?: string;
  userId?: string;
  isTyping?: boolean;
  messageId?: string;
  [key: string]: unknown;
}

export interface GroupMessagePayload {
  type:
    | 'message.sent'
    | 'message.read'
    | 'user.joined'
    | 'user.left'
    | 'typing';
  groupId: string;
  senderId?: string;
  userId?: string;
  isTyping?: boolean;
  messageId?: string;
  [key: string]: unknown;
}

@Injectable()
export class ChatPubSubService {
  private readonly logger = new Logger(ChatPubSubService.name);

  private readonly DM_CHANNEL_PREFIX = 'chat:dm';
  private readonly GROUP_CHANNEL_PREFIX = 'chat:group';

  constructor(private readonly pubsubService: RedisPubSubService) {}

  private getDMChannel(conversationId: string): string {
    return `${this.DM_CHANNEL_PREFIX}:${conversationId}`;
  }

  private getGroupChannel(groupId: string): string {
    return `${this.GROUP_CHANNEL_PREFIX}:${groupId}`;
  }

  async publishDirectMessage(
    conversationId: string,
    payload: DirectMessagePayload,
  ): Promise<number> {
    const channel = this.getDMChannel(conversationId);

    try {
      return await this.pubsubService.publish(channel, {
        ...payload,
        timestamp: Date.now(),
      });
    } catch (error) {
      throw RedisException.pubsubPublishFailed(channel, error as Error);
    }
  }

  async publishGroupMessage(
    groupId: string,
    payload: GroupMessagePayload,
  ): Promise<number> {
    const channel = this.getGroupChannel(groupId);

    try {
      return await this.pubsubService.publish(channel, {
        ...payload,
        timestamp: Date.now(),
      });
    } catch (error) {
      throw RedisException.pubsubPublishFailed(channel, error as Error);
    }
  }

  async subscribeToDirectMessage(
    conversationId: string,
    handler: MessageHandler<DirectMessagePayload>,
  ): Promise<void> {
    const channel = this.getDMChannel(conversationId);

    try {
      await this.pubsubService.subscribe(channel, handler);
    } catch (error) {
      throw RedisException.pubsubSubscriptionFailed(channel, error as Error);
    }
  }

  async subscribeToGroupMessages(
    groupId: string,
    handler: MessageHandler<GroupMessagePayload>,
  ): Promise<void> {
    const channel = this.getGroupChannel(groupId);

    try {
      await this.pubsubService.subscribe(channel, handler);
    } catch (error) {
      throw RedisException.pubsubSubscriptionFailed(channel, error as Error);
    }
  }

  async unsubscribeFromDirect(conversationId: string): Promise<void> {
    const channel = this.getDMChannel(conversationId);

    try {
      await this.pubsubService.unsubscribe(channel);
    } catch (error) {
      throw RedisException.pubsubSubscriptionFailed(channel, error as Error);
    }
  }

  async unsubscribeFromGroup(groupId: string): Promise<void> {
    const channel = this.getGroupChannel(groupId);

    try {
      await this.pubsubService.unsubscribe(channel);
    } catch (error) {
      throw RedisException.pubsubSubscriptionFailed(channel, error as Error);
    }
  }

  isDMSubscribed(conversationId: string): boolean {
    return this.pubsubService.isSubscribed(this.getDMChannel(conversationId));
  }

  isGroupSubscribed(groupId: string): boolean {
    return this.pubsubService.isSubscribed(this.getGroupChannel(groupId));
  }

  getActiveSubscriptions(): { dms: string[]; groups: string[] } {
    const subscriptions = this.pubsubService.getSubscriptions();
    const dms: string[] = [];
    const groups: string[] = [];

    for (const sub of subscriptions) {
      if (sub.startsWith(this.DM_CHANNEL_PREFIX)) {
        dms.push(sub.replace(`${this.DM_CHANNEL_PREFIX}:`, ''));
      } else if (sub.startsWith(this.GROUP_CHANNEL_PREFIX)) {
        groups.push(sub.replace(`${this.GROUP_CHANNEL_PREFIX}:`, ''));
      }
    }

    return { dms, groups };
  }
}
