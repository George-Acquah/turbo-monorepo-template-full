import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import {
  ApiResponse,
  AppRequest,
  type ApiErrorItem,
  type Response as ExpressResponse,
} from '@repo/types';
import { CONTEXT_TOKEN, ContextPort } from '@repo/ports';
import { Inject } from '@nestjs/common';
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

function normalizeHttpExceptionResponse(res: unknown): {
  message: string | null;
  errors?: ApiErrorItem[];
} {
  if (typeof res === 'string') return { message: res };

  if (res && typeof res === 'object') {
    const r = res as any;

    // validation: message: string[]
    if (Array.isArray(r.message)) {
      const msgs = r.message
        .flatMap((m: any) => (Array.isArray(m) ? m : [m]))
        .map((m: any) => String(m));
      return { message: msgs.join('; '), errors: msgs };
    }

    if (r.message != null) return { message: String(r.message) };
  }

  return { message: null };
}

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<ExpressResponse>();
    const req = http.getRequest<Request>();

    const correlationId = getCorrelationId(this.ctx);
    const reqMeta = buildRequestMeta(this.ctx);

    // If some code threw ApiResponse directly
    if (isApiResponseLike(exception)) {
      if ((exception as any).correlationId == null && correlationId)
        (exception as any).correlationId = correlationId;
      if ((exception as any).meta == null && reqMeta) (exception as any).meta = reqMeta;
      return res.status((exception as any).statusCode).json(exception);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      // If HttpException already carries ApiResponse-like payload
      if (isApiResponseLike(payload)) {
        if ((payload as any).correlationId == null && correlationId)
          (payload as any).correlationId = correlationId;
        if ((payload as any).meta == null && reqMeta) (payload as any).meta = reqMeta;
        return res.status(status).json(payload);
      }

      const { message, errors } = normalizeHttpExceptionResponse(payload);

      const wrapped = ApiResponse.create<null>(status, null, {
        correlationId,
        meta: reqMeta ?? { method: req.method, path: req.url },
        message,
        error: exception.name ?? 'HttpException',
        errors,
        bigInt: 'string',
      });

      return res.status(status).json(wrapped);
    }

    // Unknown exception
    const wrapped = ApiResponse.create<null>(HttpStatus.INTERNAL_SERVER_ERROR, null, {
      correlationId,
      meta: reqMeta ?? { method: req.method, path: req.url },
      message: 'Internal server error',
      error: 'InternalServerError',
      bigInt: 'string',
    });

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(wrapped);
  }
}
