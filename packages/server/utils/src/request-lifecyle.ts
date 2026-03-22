import type { AppRequest } from '@repo/types';
import { ContextPort } from '@repo/ports';

type RequestLike = Pick<AppRequest, 'headers' | 'ip'> & {
  method?: string;
  baseUrl?: string;
  path?: string;
  url?: string;
  originalUrl?: string;
};

type WebSocketClientLike = {
  id?: string;
  handshake?: {
    address?: string;
    headers?: Record<string, unknown>;
    query?: Record<string, unknown>;
    url?: string;
  };
  nsp?: {
    name?: string;
  };
};

function headerString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function getRequestPath(request?: RequestLike | null): string | undefined {
  if (request?.originalUrl) return request.originalUrl;

  if (request?.baseUrl || request?.path) {
    const composedPath = `${request?.baseUrl ?? ''}${request?.path ?? ''}`;
    if (composedPath) return composedPath;
  }

  return request?.url ?? request?.path;
}

function readHeader(
  headers: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  return headerString(headers?.[key]);
}

export function safeContext<T>(ctx: ContextPort, fn: () => T, fallback: T): T {
  try {
    if (!ctx.isInContext()) return fallback;
    return fn();
  } catch {
    return fallback;
  }
}

export function buildHttpRequestMeta(
  ctx: ContextPort,
  request?: RequestLike | null,
): Record<string, unknown> | null {
  const meta: Record<string, unknown> = {};

  const method =
    safeContext(ctx, () => ctx.getMethod(), undefined) ?? request?.method;
  const requestPath = getRequestPath(request);
  const contextPath = safeContext(ctx, () => ctx.getRoutePath(), undefined);
  const path =
    contextPath && (contextPath !== '/' || !requestPath || requestPath === '/')
      ? contextPath
      : requestPath;
  const ip =
    safeContext(ctx, () => ctx.getIp(), undefined) ?? request?.ip;
  const ua =
    normalizeUnknown(safeContext(ctx, () => ctx.getUserAgent(), undefined)) ??
    readHeader(request?.headers, 'user-agent');
  const deviceId =
    safeContext(ctx, () => ctx.getDeviceId(), undefined) ??
    readHeader(request?.headers, 'x-device-id');

  if (method) meta.method = method;
  if (path) meta.path = path;
  if (ip) meta.ip = ip;
  if (ua) meta.userAgent = ua;
  if (deviceId) meta.deviceId = deviceId;

  return Object.keys(meta).length ? meta : null;
}

export function buildWebSocketMeta(
  ctx: ContextPort,
  client?: WebSocketClientLike | null,
): Record<string, unknown> | null {
  const meta: Record<string, unknown> = {};

  const ip =
    safeContext(ctx, () => ctx.getIp(), undefined) ?? client?.handshake?.address;
  const userAgent =
    safeContext(ctx, () => ctx.getUserAgent(), undefined) ??
    readHeader(client?.handshake?.headers, 'user-agent');
  const deviceId =
    safeContext(ctx, () => ctx.getDeviceId(), undefined) ??
    readHeader(client?.handshake?.headers, 'x-device-id');

  if (client?.id) meta.socketId = client.id;
  if (client?.nsp?.name) meta.namespace = client.nsp.name;
  if (client?.handshake?.url) meta.path = client.handshake.url;
  if (ip) meta.ip = ip;
  if (userAgent) meta.userAgent = userAgent;
  if (deviceId) meta.deviceId = deviceId;

  return Object.keys(meta).length ? meta : null;
}

export function getCorrelationIdFromHttpRequest(request?: RequestLike | null): string | null {
  return (
    readHeader(request?.headers, 'x-request-id') ??
    readHeader(request?.headers, 'x-correlation-id') ??
    null
  );
}

export function getCorrelationIdFromWebSocketClient(
  client?: WebSocketClientLike | null,
): string | null {
  const query = client?.handshake?.query;

  return (
    readHeader(client?.handshake?.headers, 'x-request-id') ??
    readHeader(client?.handshake?.headers, 'x-correlation-id') ??
    headerString(query?.requestId) ??
    headerString(query?.correlationId) ??
    null
  );
}

export function getCorrelationId(ctx: ContextPort, fallback?: string | null): string | null {
  const requestId = normalizeUnknown(safeContext(ctx, () => ctx.getRequestId(), undefined));
  return requestId ?? fallback ?? null;
}

function normalizeUnknown(value: string | undefined): string | undefined {
  return value === 'unknown' ? undefined : value;
}
