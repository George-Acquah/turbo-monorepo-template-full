/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AsyncContextService } from '@repo/context';

/**
 * OptionalAuthGuard - Allows both authenticated and unauthenticated requests.
 *
 * If a valid JWT is present, the user is authenticated and set in context.
 * If no JWT or invalid JWT, the request continues without a user.
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly contextService: AsyncContextService) {
    super();
  }

  handleRequest(err: any, user: any, info: any, _: ExecutionContext) {
    if (err || info) {
      return null; // allow request without user
    }
    // User is already set in context by JwtStrategy.validate()
    return user;
  }
}
