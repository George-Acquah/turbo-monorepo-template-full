import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PaymentLinkTokenService } from './payment-link-token.service';

/**
 * Registers `PaymentLinkOrJwtGuard`'s constructor dependencies for DI —
 * needed because that guard is instantiated via `@UseGuards(...)`, which
 * resolves its deps through the host module's injector.
 *
 * It injects BOTH `PaymentLinkTokenService` and `JwtAuthGuard` (it delegates
 * to the JWT branch first, falling back to payment-link verification), so
 * both are provided here. `JwtAuthGuard` is normally referenced as a class in
 * `@UseGuards(JwtAuthGuard)` — where Nest constructs it directly — but being
 * *injected* makes it an ordinary provider that has to be registered. It has
 * no constructor deps of its own (it only overrides `handleRequest`), so
 * registering it here is safe; the underlying 'jwt' passport strategy is
 * still supplied by `AuthCoreModule`.
 */
@Global()
@Module({
  providers: [PaymentLinkTokenService, JwtAuthGuard],
  exports: [PaymentLinkTokenService, JwtAuthGuard],
})
export class PaymentLinkTokenModule {}
