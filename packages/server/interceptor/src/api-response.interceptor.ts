import type { Response as ExpressResponse } from '@repo/types/express';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
  NestInterceptor,
  RequestMethod,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { CONTEXT_TOKEN, ContextPort } from '@repo/ports';
import { SKIP_HTTP_RESPONSE_ENVELOPE_KEY } from '@repo/decorators';
import {
  buildHttpRequestMeta,
  createHttpSuccessEnvelope,
  getCorrelationId,
  getCorrelationIdFromHttpRequest,
  isNoContentStatus,
} from '@repo/utils';
import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants.js';
// import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants';

@Injectable()
export class HttpResponseEnvelopeInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    if (context.getType<'http' | 'ws' | 'rpc'>() !== 'http') {
      return next.handle();
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_HTTP_RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse<ExpressResponse>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = this.resolveStatusCode(context, res);

        if (isNoContentStatus(statusCode)) {
          if (typeof res?.status === 'function') res.status(statusCode);
          return undefined;
        }

        const wrapped = createHttpSuccessEnvelope(statusCode, data, {
          correlationId: getCorrelationId(this.ctx, getCorrelationIdFromHttpRequest(req)),
          meta: buildHttpRequestMeta(this.ctx, req),
        });

        if (typeof res?.status === 'function') res.status(statusCode);
        return wrapped;
      }),
    );
  }

  private resolveStatusCode(context: ExecutionContext, res: ExpressResponse): number {
    if (typeof res?.statusCode === 'number' && res.statusCode > 0) {
      return res.statusCode;
    }

    const explicitHttpCode = this.reflector.getAllAndOverride<number>(HTTP_CODE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (typeof explicitHttpCode === 'number' && explicitHttpCode > 0) {
      return explicitHttpCode;
    }

    const requestMethod = this.reflector.getAllAndOverride<RequestMethod>(METHOD_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requestMethod === RequestMethod.POST) {
      return HttpStatus.CREATED;
    }

    return HttpStatus.OK;
  }
}
