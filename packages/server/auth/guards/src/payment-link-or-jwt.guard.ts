import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AppRequest, PaymentLinkIdentity } from '@workspace/types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PaymentLinkTokenService } from './payment-link-token.service';
import { PaymentLinkInvalidException } from './errors/payment-link.errors';

interface PaymentLinkClaims {
  sub: string;
  scope: string;
  orderId?: string;
  enrolmentId?: string;
  exp?: number;
}

/**
 * Accepts EITHER a valid JWT OR a valid payment-link token — the `jwt|plt`
 * auth doc 05 describes for the payments endpoints. Tries `JwtAuthGuard`
 * first; on failure (it throws, per its own `handleRequest`), falls back to
 * verifying a payment-link token and attaching a `PaymentLinkIdentity` to
 * the request instead of a `UserContext`.
 *
 * Lives fully in `@workspace/guards` — a consumer that only needs
 * `@UseGuards(...)` doesn't have to depend on `@workspace/auth-core`'s full weight
 * (argon2/otplib/qrcode/passport strategies) just to gate a route with this.
 *
 * Authorization (does this identity actually own the target order?) is
 * deliberately NOT checked here — guards run before the validation pipe, so
 * `request.body` isn't reliably shaped yet. That check happens once, in the
 * use-case, regardless of which branch resolved the caller.
 */
@Injectable()
export class PaymentLinkOrJwtGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly paymentLinkTokens: PaymentLinkTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await this.jwtAuthGuard.canActivate(context)) as boolean;
    } catch {
      // Fall through to payment-link verification.
    }

    const request = context.switchToHttp().getRequest<AppRequest<PaymentLinkIdentity>>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new PaymentLinkInvalidException('Missing bearer token');
    }

    let claims: PaymentLinkClaims;
    try {
      claims = this.paymentLinkTokens.verify<PaymentLinkClaims>(token);
    } catch {
      throw new PaymentLinkInvalidException();
    }

    if (claims.scope !== 'payment') {
      throw new PaymentLinkInvalidException('Wrong token scope');
    }

    if (typeof claims.exp === 'number' && Date.now() > claims.exp) {
      throw new PaymentLinkInvalidException('Payment link has expired');
    }

    const identity: PaymentLinkIdentity = {
      profileId: claims.sub,
      orderId: claims.orderId,
      enrolmentId: claims.enrolmentId,
      source: 'payment-link',
    };
    request.user = identity;
    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string | undefined {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return undefined;
    }
    return authorizationHeader.slice('Bearer '.length).trim() || undefined;
  }
}
