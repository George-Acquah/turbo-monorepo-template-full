export interface CacheOptions {
  /** TTL in seconds */
  ttl?: number;
  /** Include version in cache key */
  versioned?: boolean;
}

export interface InvalidationEvent {
  type: 'entity' | 'list' | 'pattern';
  prefix: string;
  id?: string;
  timestamp: number;
}
