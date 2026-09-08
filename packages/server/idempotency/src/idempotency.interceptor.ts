import { createHash } from 'node:crypto';
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, from, of, switchMap, throwError } from 'rxjs';
import {
  IDEMPOTENCY_KEY_REPOSITORY_TOKEN,
  type IdempotencyKeyRepositoryPort,
} from '@workspace/ports';
import { CommonErrorCodes } from '@workspace/constants';
import { ConflictAppException } from '@workspace/utils';
import type { AppRequest } from '@workspace/types';
import type { Response } from 'express';
import { IDEMPOTENT_SCOPE_META } from './idempotent.decorator';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const IDEMPOTENCY_KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24h (doc 10 §5's 24h-7d retention window)

/**
 * Backs `@Idempotent(scope)` (doc 02 "Idempotency (API side)"). No
 * `Idempotency-Key` header → proceeds normally, opt-in per the doc. With a
 * header:
 * - a fresh key → executes the handler, then persists the response
 *   (`complete`) so a retry with the same key replays it instead of
 *   re-running the side effect. A thrown error instead calls `fail` (so a
 *   later retry with the same key is treated as fresh, not a phantom
 *   success) and rethrows.
 * - the same key reused with a *different* request body → 409
 *   `IDEMPOTENCY_KEY_REUSED` (`IdempotencyKeyRepositoryPort.begin` itself
 *   doesn't check this — only whether a row exists — so this interceptor
 *   does the request-hash comparison before calling `begin`).
 * - the same key + same body, already completed → replays the stored
 *   response without re-running the handler (`begin`'s `SKIP` decision).
 * - the same key + same body, still in flight → `SKIP` with no stored
 *   response yet (a genuine concurrent duplicate) — surfaces as an empty
 *   success rather than a second side effect; the client's original request
 *   still resolves normally.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IDEMPOTENCY_KEY_REPOSITORY_TOKEN)
    private readonly idempotencyKeyRepo: IdempotencyKeyRepositoryPort,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const scope = this.reflector.get<string>(IDEMPOTENT_SCOPE_META, context.getHandler());
    if (!scope) return next.handle();

    const request = context.switchToHttp().getRequest<AppRequest>();
    const rawKey = request.headers[IDEMPOTENCY_KEY_HEADER];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    if (!key) return next.handle();

    const requestHash = createHash('sha256')
      .update(JSON.stringify({ method: request.method, path: request.path, body: request.body }))
      .digest('hex');

    return from(
      this.idempotencyKeyRepo.findByKey(null, scope, key, undefined, { select: ['requestHash'] }),
    ).pipe(
      switchMap((existing) => {
        if (existing && existing.requestHash && existing.requestHash !== requestHash) {
          throw new ConflictAppException(
            CommonErrorCodes.IDEMPOTENCY_KEY_REUSED,
            'This Idempotency-Key was already used with a different request',
          );
        }

        return from(
          this.idempotencyKeyRepo.begin({
            key,
            scope,
            requestHash,
            expiresAt: new Date(Date.now() + IDEMPOTENCY_KEY_TTL_MS),
          }),
        ).pipe(
          switchMap((decision) => {
            if (decision.decision === 'SKIP') {
              return of(decision.responseData);
            }

            return next.handle().pipe(
              switchMap((result) => {
                const response = context.switchToHttp().getResponse<Response>();
                return from(
                  this.idempotencyKeyRepo.complete({
                    key,
                    scope,
                    responsePayload: (result as Record<string, unknown>) ?? null,
                    statusCode: response.statusCode,
                  }),
                ).pipe(switchMap(() => of(result)));
              }),
              catchError((error) =>
                from(this.idempotencyKeyRepo.fail({ key, scope })).pipe(
                  switchMap(() => throwError(() => error)),
                ),
              ),
            );
          }),
        );
      }),
    );
  }
}
