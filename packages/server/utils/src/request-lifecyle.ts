import { ContextPort } from '@repo/ports';

export function safeContext<T>(ctx: ContextPort, fn: () => T, fallback: T): T {
  try {
    if (!ctx.isInContext()) return fallback;
    return fn();
  } catch {
    return fallback;
  }
}

export function buildRequestMeta(ctx: ContextPort): Record<string, unknown> | null {
  if (!ctx.isInContext()) return null;

  const meta: Record<string, unknown> = {};

  const method = safeContext(ctx, () => ctx.getMethod(), undefined);
  const path = safeContext(ctx, () => ctx.getRoutePath(), undefined);
  const ip = safeContext(ctx, () => ctx.getIp(), undefined);
  const ua = safeContext(ctx, () => ctx.getUserAgent(), undefined);
  const deviceId = safeContext(ctx, () => ctx.getDeviceId(), undefined);

  if (method) meta.method = method;
  if (path) meta.path = path;
  if (ip) meta.ip = ip;
  if (ua) meta.userAgent = ua;
  if (deviceId) meta.deviceId = deviceId;

  return Object.keys(meta).length ? meta : null;
}

export function getCorrelationId(ctx: ContextPort): string | null {
  return safeContext(ctx, () => ctx.getRequestId(), null);
}
