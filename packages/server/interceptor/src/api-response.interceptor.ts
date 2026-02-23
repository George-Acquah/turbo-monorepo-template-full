import type { Response as ExpressResponse } from '@repo/types/express';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '@repo/types';
import { CONTEXT_TOKEN, ContextPort } from '@repo/ports';
import { Inject } from '@nestjs/common';
import { SKIP_API_WRAP_KEY } from '@repo/decorators';
import { buildRequestMeta, getCorrelationId } from '@repo/utils';

function isApiResponseLike(
  x: unknown,
): x is { statusCode: number; success: boolean; timestamp: string } {
  if (!x || typeof x !== 'object') return false;
  const o = x as any;
  return (
    typeof o.statusCode === 'number' &&
    typeof o.success === 'boolean' &&
    typeof o.timestamp === 'string'
  );
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_API_WRAP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return next.handle();

    const http = context.switchToHttp();
    const res = http.getResponse<ExpressResponse>();

    return next.handle().pipe(
      map((data) => {
        const correlationId = getCorrelationId(this.ctx);
        const reqMeta = buildRequestMeta(this.ctx);

        // Pass-through already-wrapped payloads
        if (isApiResponseLike(data)) {
          if ((data as any).correlationId == null && correlationId)
            (data as any).correlationId = correlationId;

          // Merge in request meta only if response has no meta
          if ((data as any).meta == null && reqMeta) (data as any).meta = reqMeta;

          if (typeof res?.status === 'function') res.status((data as any).statusCode);
          return data;
        }

        // Respect statusCode already set by Nest (e.g. @HttpCode, @Post -> 201 if not overwritten)
        const statusCode =
          typeof (res as any)?.statusCode === 'number' && (res as any).statusCode > 0
            ? (res as any).statusCode
            : 200;

        const wrapped = ApiResponse.create(statusCode, data as any, {
          correlationId,
          meta: reqMeta,
          bigInt: 'string',
        });

        if (typeof res?.status === 'function') res.status(wrapped.statusCode);
        return wrapped;
      }),
    );
  }
}
