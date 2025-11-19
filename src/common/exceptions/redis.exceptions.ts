export class RateLimitExceededException extends Error {
  constructor(
    public readonly limit: number,
    public readonly window: number,
  ) {
    super(`Rate limit exceeded: ${limit} operations per ${window}ms`);
    this.name = 'RateLimitExceededException';
  }
}

export class RedisHealthException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisHealthException';
  }
}

export class CompressionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompressionException';
  }
}
