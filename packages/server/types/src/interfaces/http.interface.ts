export interface HttpClientConfig {
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelay?: number;
  /** Maximum retry delay in ms (default: 10000) */
  maxRetryDelay?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Skip retry on specific status codes */
  noRetryStatuses?: number[];
  /** Enable circuit breaker (default: true) */
  circuitBreaker?: boolean;
}
