export interface RedisStreamMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content?: string;
  attachments?: Record<string, unknown> | null;
  createdAt: string;
}

export interface RedisPubSubMessage<T = Record<string, unknown>> {
  type:
    | 'message.sent'
    | 'message.read'
    | 'typing'
    | 'user.joined'
    | 'user.left';
  payload: T;
  timestamp: number;
}

export interface UnreadCounterUpdate {
  userId: string;
  conversationId: string;
  count: number;
  score: number;
}
