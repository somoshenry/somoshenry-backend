import { Injectable, Logger } from '@nestjs/common';
import { RedisStreamService } from '../../common/services/redis-streams.service';
import { RedisException } from '../../common/errors/redis.exception';
import type { StreamPaginationResult } from '../../common/types/redis-stream.types';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content?: string;
  attachments?: Record<string, unknown> | null;
  createdAt: string;
  isRead?: boolean;
  readAt?: string | null;
}

@Injectable()
export class ChatStreamService {
  private readonly logger = new Logger(ChatStreamService.name);

  private readonly DM_STREAM_PREFIX = 'stream:chat:dm';
  private readonly GROUP_STREAM_PREFIX = 'stream:chat:group';
  private readonly STREAM_MAX_LEN = 50000;

  constructor(private readonly streamService: RedisStreamService) {}

  private getStreamKey(conversationId: string, type: 'dm' | 'group'): string {
    const prefix =
      type === 'dm' ? this.DM_STREAM_PREFIX : this.GROUP_STREAM_PREFIX;
    return `${prefix}:${conversationId}`;
  }

  async addMessage(
    conversationId: string,
    message: ChatMessage,
    type: 'dm' | 'group' = 'dm',
  ): Promise<string> {
    const key = this.getStreamKey(conversationId, type);

    try {
      const streamId = await this.streamService.add(
        key,
        message as unknown as Record<string, unknown>,
      );

      await this.streamService.truncate(key, {
        maxlen: this.STREAM_MAX_LEN,
        approximate: true,
      });

      return streamId;
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'addMessage',
        key,
        error as Error,
      );
    }
  }

  async getMessageHistory(
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<ChatMessage[]> {
    const key = this.getStreamKey(conversationId, type);

    try {
      const entries = await this.streamService.read<ChatMessage>(key, '0');
      return entries.map((entry) => entry.data);
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'getMessageHistory',
        key,
        error as Error,
      );
    }
  }

  async getMessagesPaginated(
    conversationId: string,
    page: number = 1,
    pageSize: number = 50,
    type: 'dm' | 'group' = 'dm',
  ): Promise<StreamPaginationResult<ChatMessage>> {
    const key = this.getStreamKey(conversationId, type);

    try {
      return await this.streamService.paginate<ChatMessage>(
        key,
        page,
        pageSize,
        true,
      );
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'getMessagesPaginated',
        key,
        error as Error,
      );
    }
  }

  async getMessagesFromCursor(
    conversationId: string,
    cursorId: string,
    pageSize: number = 50,
    type: 'dm' | 'group' = 'dm',
  ): Promise<ChatMessage[]> {
    const key = this.getStreamKey(conversationId, type);

    try {
      const entries = await this.streamService.readBackward<ChatMessage>(
        key,
        `(${cursorId}`,
        pageSize,
      );
      return entries.map((entry) => entry.data);
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'getMessagesFromCursor',
        key,
        error as Error,
      );
    }
  }

  async deleteMessage(
    conversationId: string,
    streamId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<boolean> {
    const key = this.getStreamKey(conversationId, type);

    try {
      const result = await this.streamService.delete(key, streamId);
      return result > 0;
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'deleteMessage',
        key,
        error as Error,
      );
    }
  }

  async deleteConversationStream(
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<boolean> {
    const key = this.getStreamKey(conversationId, type);

    try {
      const result = await this.streamService.deleteStream(key);
      return result > 0;
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'deleteConversationStream',
        key,
        error as Error,
      );
    }
  }

  async getStreamLength(
    conversationId: string,
    type: 'dm' | 'group' = 'dm',
  ): Promise<number> {
    const key = this.getStreamKey(conversationId, type);

    try {
      return await this.streamService.len(key);
    } catch (error) {
      throw RedisException.streamOperationFailed(
        'getStreamLength',
        key,
        error as Error,
      );
    }
  }
}
