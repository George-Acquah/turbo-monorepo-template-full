// import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
// import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
// import {
//   CallHandler,
//   NestInterceptor,
// } from '@nestjs/common/interfaces/features/nest-interceptor.interface';
// import { Reflector } from '@nestjs/core/services/reflector.service';
// import { Observable } from 'rxjs/internal/Observable';
// import {
//   THROTTLER_LIMIT,
//   THROTTLER_TTL,
// } from '../constants/throttle.constants';
// import { tap } from 'rxjs/internal/operators/tap';

// @Injectable()
// export class RateLimitInterceptor implements NestInterceptor {
//   constructor(private reflector: Reflector) {}

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const ctx = context.switchToHttp();
//     const response = ctx.getResponse();

//     const limit = this.reflector.getAllAndOverride<number>(THROTTLER_LIMIT, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     const ttl = this.reflector.getAllAndOverride<number>(THROTTLER_TTL, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     return next.handle().pipe(
//       tap(() => {
//         if (limit && ttl) {
//           response.setHeader('X-RateLimit-Limit', limit);
//           response.setHeader('X-RateLimit-Reset', ttl);
//         }
//       }),
//     );
//   }
// }
