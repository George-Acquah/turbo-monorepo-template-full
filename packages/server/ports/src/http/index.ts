import { HttpClientConfig } from '@repo/types';

export abstract class HttpPort {
  abstract get<T = unknown>(url: string, config?: HttpClientConfig): Promise<T>;

  abstract post<T = unknown>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T>;

  abstract put<T = unknown>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T>;

  abstract patch<T = unknown>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T>;

  abstract delete<T = unknown>(url: string, config?: HttpClientConfig): Promise<T>;
}

export const HTTP_PORT_TOKEN = Symbol('HTTP_PORT_TOKEN');
