import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN, type UserRepositoryPort } from '@workspace/ports';
import type { TokenPair } from '@workspace/types';
import { SessionIssuerService } from '../services/session-issuer.service';
import type { LoginInput } from '../dto';

/**
 * Credential verification already happened — LocalAuthGuard (@workspace/guards)
 * runs EmailPasswordStrategy (@workspace/auth-core), which finds the user by
 * email and compares the password hash before this use-case ever runs. This
 * only does what's left: reset failed-login counters and issue a session
 * (SessionIssuerService emits the `auth.session.created` fact).
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(input: LoginInput): Promise<TokenPair> {
    const user = await this.userRepo.resetFailedLogins(
      input.userId,
      input.ipAddress ?? undefined,
      new Date(),
    );

    return this.sessionIssuer.issue({
      userId: user.id,
      userType: user.userType,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform,
      browser: input.browser,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
