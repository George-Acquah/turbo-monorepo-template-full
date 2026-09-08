/**
 * ============================================================================
 * HTTP API LOGGING INTERCEPTOR
 * ============================================================================
 *
 * Fire-and-forget audit trail for HTTP requests. Writes one ApiLog row per
 * request (success or failure) via AuditCommandPort — a create-only table
 * (see AuditPersistenceModule's doc comment), so this is always a single
 * `createApiLog` insert per request, never an update.
 *
 * AUDIT_COMMAND_PORT is injected with @Optional() because this interceptor is
 * generic/cross-cutting infra with no natural import path into one bounded
 * context's module tree — it depends on AuditPersistenceModule being
 * @Global() and instantiated somewhere in the same process (apps/api does,
 * via modules/audit's AuditModule). If it isn't, ApiLog writes are silently
 * skipped rather than the app failing to boot.
 *
 * Known scaling limit: this is a synchronous fire-and-forget Prisma insert
 * per request. That is the correct scope for this pass — if request volume
 * ever makes this a bottleneck, batching/queueing the writes is a follow-up,
 * not something to build speculatively here.
 */

import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type {
  AppRequest,
  Response as ExpressResponse,
} from '@workspace/types/express';
import {
  AUDIT_COMMAND_PORT,
  AuditCommandPort,
  CONTEXT_TOKEN,
  ContextPort,
  LOGGER_TOKEN,
  LoggerPort,
} from '@workspace/ports';

@Injectable()
export class ApiLoggingInterceptor<T> implements NestInterceptor<T, T> {
  // `req.path` is the real incoming URL. Controllers (health/metrics/realtime)
  // sit behind the global `/api` prefix (`app.setGlobalPrefix('api', ...)`
  // doesn't rewrite `req.path`/`req.url`, only route registration) — a health
  // check's real path is `/api/health`, not `/health`. Swagger's UI/JSON
  // routes are the one exception: `SwaggerModule.setup('docs', app, ...)`
  // (apps/api/src/setups/swagger.setup.ts) registers directly on the Express
  // instance, bypassing Nest's routing entirely, so those stay bare `/docs`.
  private static readonly EXCLUDED_PATH_PATTERNS: RegExp[] = [
    /^\/api\/(v\d+\/)?health/,
    /^\/api\/(v\d+\/)?metrics/,
    /^\/docs/,
    /^\/api\/v\d+\/realtime\/stream/,
  ];

  constructor(
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
    @Optional()
    @Inject(AUDIT_COMMAND_PORT)
    private readonly auditCommand: AuditCommandPort | undefined,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  intercept(executionContext: ExecutionContext, next: CallHandler<T>): Observable<T> {
    if (executionContext.getType<'http' | 'ws' | 'rpc'>() !== 'http' || !this.auditCommand) {
      return next.handle();
    }

    const req = executionContext.switchToHttp().getRequest<AppRequest>();
    const path: string = req?.path ?? this.context.getRoutePath() ?? 'unknown';
    const method: string = req?.method ?? this.context.getMethod() ?? 'UNKNOWN';

    if (
      method === 'OPTIONS' ||
      ApiLoggingInterceptor.EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(path))
    ) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.record(executionContext, method, path, startedAt),
        error: (err: unknown) => this.record(executionContext, method, path, startedAt, err),
      }),
    );
  }

  private record(
    executionContext: ExecutionContext,
    method: string,
    path: string,
    startedAt: number,
    error?: unknown,
  ): void {
    const res = executionContext.switchToHttp().getResponse<ExpressResponse>();
    const statusCode = typeof res?.statusCode === 'number' ? res.statusCode : 0;

    void this.auditCommand!
      .createApiLog({
        method,
        path,
        statusCode,
        userId: this.context.getUserIdOptional(),
        ipAddress: this.context.getIp(),
        userAgent: this.context.getUserAgent(),
        requestId: this.context.getRequestId(),
        durationMs: Date.now() - startedAt,
        occurredAt: new Date(),
        errorMessage: error instanceof Error ? error.message : undefined,
      })
      .catch((e: unknown) =>
        this.logger.warn(`ApiLog write failed: ${String(e)}`, 'ApiLoggingInterceptor'),
      );
  }
}
