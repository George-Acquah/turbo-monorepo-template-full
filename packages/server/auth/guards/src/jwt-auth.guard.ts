import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthErrorCodes } from '@workspace/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    info: { name?: string } | undefined,
  ): TUser {
    // A strategy that already threw a coded exception (e.g. JwtAccessStrategy's
    // UserNotFoundOrInactiveException) — propagate it as-is.
    if (err) {
      throw err;
    }

    if (!user) {
      const errorCode =
        info?.name === 'TokenExpiredError'
          ? AuthErrorCodes.AUTH_TOKEN_EXPIRED
          : AuthErrorCodes.AUTH_UNAUTHORIZED;
      throw new UnauthorizedException({ message: 'Unauthorized', error: 'Unauthorized', errorCode });
    }

    return user as TUser;
  }
}
