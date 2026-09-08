import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER_TOKEN,
  USER_REPOSITORY_TOKEN,
  USER_SESSION_REPOSITORY_TOKEN,
  type EventPublisherPort,
  type UserRepositoryPort,
  type UserSessionRepositoryPort,
} from '@workspace/ports';
import { AggregateType } from '@workspace/constants';
import { AuthEvents, type TokenPair } from '@workspace/types';
import { UserNotFoundOrInactiveException } from '@workspace/auth-core';
import { SessionIssuerService } from '../services/session-issuer.service';
import type { RefreshTokenInput } from '../dto';

/**
 * RefreshTokenGuard (@workspace/guards) + RefreshTokenStrategy
 * (@workspace/auth-core) already verified the refresh JWT's signature/expiry and
 * that the session (by jti) is still active before this runs. This rotates
 * it: re-fetch the user for its *current* userType/status (it may have
 * changed since the token was issued), revoke the old session, issue a fresh
 * pair (SessionIssuerService emits `auth.session.created` for the new one).
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort,
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: UserSessionRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<TokenPair> {
    const user = await this.userRepo.findById(input.userId, {
      select: ['id', 'userType', 'status', 'deletedAt'],
    });
    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UserNotFoundOrInactiveException();
    }

    // Explicit RLS override: no tx here, and no request-scoped identity yet
    // either — user.id was just resolved above. See docs/infrastructure/
    // runbooks/db-rls-policies.sql's v5 entry.
    await this.sessionRepo.revokeSessionByJti(input.jti, undefined, user.id);

    // Fact: the old session was revoked as part of rotation.
    await this.publisher.publish({
      eventType: AuthEvents.SESSION_REVOKED,
      aggregateType: AggregateType.USER,
      aggregateId: user.id,
      userId: user.id,
      payload: { userId: user.id, sessionId: input.jti, reason: 'REFRESH_ROTATION' },
    });

    return this.sessionIssuer.issue({
      userId: user.id,
      userType: user.userType,
      deviceId: input.deviceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
