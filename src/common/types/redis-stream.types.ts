export type StreamId = string;

export interface StreamEntry<T = Record<string, unknown>> {
  id: StreamId;
  data: T;
}

export interface StreamReadOptions {
  count?: number;
  block?: number;
}

export interface StreamPaginationCursor {
  id: StreamId;
  isInitial: boolean;
}

export type StreamDirection = 'forward' | 'backward';

export interface StreamPaginationResult<T = Record<string, unknown>> {
  entries: StreamEntry<T>[];
  cursor: StreamPaginationCursor;
  hasMore: boolean;
}

export interface StreamTruncateOptions {
  maxlen?: number;
  approximate?: boolean;
}
