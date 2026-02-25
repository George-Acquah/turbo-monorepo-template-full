/**
 * Resilient HTTP Client Service
 *
 * Provides a centralized HTTP client wrapper with:
 * - Configurable timeouts
 * - Automatic retries with exponential backoff
 * - Circuit breaker pattern
 * - Request/response logging
 * - Correlation ID propagation
 *
 * All external HTTP calls should go through this service.
 *
 * @example
 * ```typescript
 * const response = await this.httpClient.get<PaymentResponse>(
 *   'https://api.paystack.co/transaction/verify/ref123',
 *   {
 *     headers: { Authorization: `Bearer ${secretKey}` },
 *     retries: 3,
 *     timeout: 10000,
 *   },
 * );
 * ```
 */

import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, timer, throwError, Observable } from 'rxjs';
import { retry, catchError, timeout } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import { HttpClientConfig } from '@repo/types';
import { CONTEXT_TOKEN, ContextPort, HttpPort, LOGGER_TOKEN, LoggerPort } from '@repo/ports';

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const DEFAULT_CONFIG: Required<Omit<HttpClientConfig, 'headers'>> = {
  timeout: 15000,
  retries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  noRetryStatuses: [400, 401, 403, 404, 422],
  circuitBreaker: true,
};

const CIRCUIT_THRESHOLD = 5; // Failures before opening
const CIRCUIT_RESET_TIME = 30000; // ms before trying again

@Injectable()
export class HttpClientService implements HttpPort {
  private readonly context = HttpClientService.name;
  private circuits: Map<string, CircuitState> = new Map();

  constructor(
    private readonly http: HttpService,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(CONTEXT_TOKEN) private readonly contextService: ContextPort,
  ) {}

  /**
   * Perform a GET request
   */
  async get<T = unknown>(url: string, config?: HttpClientConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * Perform a POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * Perform a PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * Perform a PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T = unknown>(url: string, config?: HttpClientConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Core request method with resilience patterns
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: unknown,
    config?: HttpClientConfig,
  ): Promise<T> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const circuitKey = this.getCircuitKey(url);

    // Check circuit breaker
    if (mergedConfig.circuitBreaker && this.isCircuitOpen(circuitKey)) {
      throw new Error(`Circuit breaker open for ${circuitKey}. Try again later.`);
    }

    const requestId = this.contextService.getRequestId();
    const startTime = Date.now();

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...config?.headers,
    };

    this.logger.debug(`HTTP ${method} ${url} [requestId=${requestId}]`, this.context);

    try {
      // Create the request observable - use any to avoid Axios type complexity
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let request$: Observable<any>;

      switch (method) {
        case 'GET':
          request$ = this.http.get(url, { headers });
          break;
        case 'POST':
          request$ = this.http.post(url, data, { headers });
          break;
        case 'PUT':
          request$ = this.http.put(url, data, { headers });
          break;
        case 'PATCH':
          request$ = this.http.patch(url, data, { headers });
          break;
        case 'DELETE':
          request$ = this.http.delete(url, { headers });
          break;
      }

      // Apply timeout
      const withTimeout$ = request$.pipe(timeout(mergedConfig.timeout));

      // Apply retry with exponential backoff
      const withRetry$ = withTimeout$.pipe(
        retry({
          count: mergedConfig.retries,
          delay: (error, retryCount) => {
            // Don't retry on specific status codes
            const status = error?.response?.status;
            if (status && mergedConfig.noRetryStatuses.includes(status)) {
              return throwError(() => error);
            }

            // Exponential backoff with jitter
            const delay = Math.min(
              mergedConfig.retryDelay * Math.pow(2, retryCount - 1) + Math.random() * 1000,
              mergedConfig.maxRetryDelay,
            );

            this.logger.warn(
              `HTTP retry ${retryCount}/${mergedConfig.retries} for ${method} ${url} after ${delay}ms`,
              this.context,
            );

            return timer(delay);
          },
        }),
        catchError((error) => {
          // Record failure for circuit breaker
          if (mergedConfig.circuitBreaker) {
            this.recordFailure(circuitKey);
          }
          return throwError(() => error);
        }),
      );

      // Execute request
      const response = await lastValueFrom(withRetry$);
      const duration = Date.now() - startTime;

      this.logger.debug(
        `HTTP ${method} ${url} completed in ${duration}ms [status=${response.status}]`,
        this.context,
      );

      // Record success for circuit breaker
      if (mergedConfig.circuitBreaker) {
        this.recordSuccess(circuitKey);
      }

      return (response as unknown as AxiosResponse<T>).data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const status = (error as { response?: { status: number } })?.response?.status;

      this.logger.error(
        `HTTP ${method} ${url} failed after ${duration}ms: ${errorMessage} [status=${status}]`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Circuit Breaker Implementation
  // ─────────────────────────────────────────────────────────────────────────────

  private getCircuitKey(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return url.split('/')[2] || url;
    }
  }

  private isCircuitOpen(key: string): boolean {
    const circuit = this.circuits.get(key);
    if (!circuit) return false;

    if (circuit.state === 'open') {
      // Check if we should try half-open
      if (Date.now() - circuit.lastFailure > CIRCUIT_RESET_TIME) {
        circuit.state = 'half-open';
        this.logger.log(`Circuit breaker for ${key} moved to half-open`, this.context);
        return false;
      }
      return true;
    }

    return false;
  }

  private recordFailure(key: string): void {
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = { failures: 0, lastFailure: 0, state: 'closed' };
      this.circuits.set(key, circuit);
    }

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= CIRCUIT_THRESHOLD) {
      circuit.state = 'open';
      this.logger.warn(
        `Circuit breaker for ${key} opened after ${circuit.failures} failures`,
        this.context,
      );
    }
  }

  private recordSuccess(key: string): void {
    const circuit = this.circuits.get(key);
    if (circuit) {
      if (circuit.state === 'half-open') {
        circuit.state = 'closed';
        circuit.failures = 0;
        this.logger.log(`Circuit breaker for ${key} closed`, this.context);
      } else if (circuit.state === 'closed' && circuit.failures > 0) {
        // Gradually reduce failure count on success
        circuit.failures = Math.max(0, circuit.failures - 1);
      }
    }
  }

  /**
   * Get circuit breaker status (for monitoring)
   */
  getCircuitStatus(key: string): CircuitState | undefined {
    return this.circuits.get(key);
  }

  /**
   * Reset circuit breaker for a key (for testing/manual reset)
   */
  resetCircuit(key: string): void {
    this.circuits.delete(key);
    this.logger.log(`Circuit breaker for ${key} manually reset`, this.context);
  }
}
