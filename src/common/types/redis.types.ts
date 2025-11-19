export type CacheContext =
  | 'room'
  | 'session'
  | 'chat'
  | 'signaling'
  | 'default';

export interface CacheEntry<T = unknown> {
  data: T;
  compressed: boolean;
  timestamp: number;
}

export interface OperationMetrics {
  totalOperations: number;
  totalErrors: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  fallbackActive: boolean;
  fallbackDuration: number;
  compressionRatio: number;
  cacheSize: number;
}

export interface HealthCheckState {
  healthy: boolean;
  consecutiveFailures: number;
  lastCheck: number;
  nextCheck: number;
}

export const TTL_CONFIG: Record<CacheContext, number> = {
  room: 5 * 60,
  session: 30 * 60,
  chat: 60 * 60,
  signaling: 2 * 60,
  default: 10 * 60,
};

export const CONTEXT_FROM_KEY = (key: string): CacheContext => {
  if (key.startsWith('room:')) return 'room';
  if (key.startsWith('session:')) return 'session';
  if (key.startsWith('chat:')) return 'chat';
  if (key.startsWith('signaling:')) return 'signaling';
  return 'default';
};
