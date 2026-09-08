import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER_TOKEN,
  TOKEN_BLACKLIST_PORT_TOKEN,
  USER_SESSION_REPOSITORY_TOKEN,
  type EventPublisherPort,
  type TokenBlacklistPort,
  type UserSessionRepositoryPort,
} from '@workspace/ports';
import { AggregateType } from '@workspace/constants';
import { AuthEvents } from '@workspace/types';
import type { LogoutInput } from '../dto';

/**
 * Ends the current session: revokes it (so its refresh token can no longer
 * rotate), blacklists the access token by jti (so it's rejected before its
 * natural expiry — JwtAccessStrategy checks the blacklist on every request),
 * and emits the `auth.session.revoked` fact.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: UserSessionRepositoryPort,
    @Inject(TOKEN_BLACKLIST_PORT_TOKEN)
    private readonly tokenBlacklist: TokenBlacklistPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.sessionRepo.revokeSessionByJti(input.jti);

    const ttl = input.tokenExpEpochSeconds
      ? input.tokenExpEpochSeconds - Math.floor(Date.now() / 1000)
      : 0;
    if (ttl > 0) {
      await this.tokenBlacklist.blacklist(input.jti, ttl);
    }

    await this.publisher.publish({
      eventType: AuthEvents.SESSION_REVOKED,
      aggregateType: AggregateType.USER,
      aggregateId: input.userId,
      userId: input.userId,
      payload: { userId: input.userId, sessionId: input.jti, reason: 'LOGOUT' },
    });
  }
}
