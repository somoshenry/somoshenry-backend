export class RedisException extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RedisException';
    Object.setPrototypeOf(this, RedisException.prototype);
  }

  static streamOperationFailed(operation: string, key: string, cause?: Error) {
    return new RedisException(
      'STREAM_OPERATION_FAILED',
      `Stream operation '${operation}' failed for key '${key}'`,
      cause,
    );
  }

  static pubsubPublishFailed(channel: string, cause?: Error) {
    return new RedisException(
      'PUBSUB_PUBLISH_FAILED',
      `Failed to publish to channel '${channel}'`,
      cause,
    );
  }

  static pubsubSubscriptionFailed(channel: string, cause?: Error) {
    return new RedisException(
      'PUBSUB_SUBSCRIPTION_FAILED',
      `Failed to subscribe to channel '${channel}'`,
      cause,
    );
  }

  static rateLimitExceeded(identifier: string, limit: number) {
    return new RedisException(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded for '${identifier}' (limit: ${limit})`,
    );
  }

  static sortedSetOperationFailed(
    operation: string,
    key: string,
    cause?: Error,
  ) {
    return new RedisException(
      'SORTED_SET_OPERATION_FAILED',
      `Sorted set operation '${operation}' failed for key '${key}'`,
      cause,
    );
  }

  static redisUnavailable(cause?: Error) {
    return new RedisException(
      'REDIS_UNAVAILABLE',
      'Redis service is unavailable',
      cause,
    );
  }
}
