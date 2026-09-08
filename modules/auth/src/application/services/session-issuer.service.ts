import { Inject, Injectable } from '@nestjs/common';
import { generateId } from '@workspace/utils';
import {
  EVENT_PUBLISHER_TOKEN,
  HASH_PORT_TOKEN,
  TOKEN_PORT_TOKEN,
  USER_SESSION_REPOSITORY_TOKEN,
  type EventPublisherPort,
  type HashPort,
  type TokenPort,
  type UserSessionRepositoryPort,
} from '@workspace/ports';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';
import { AggregateType } from '@workspace/constants';
import { AuthEvents, type AccessTokenClaims, type TokenPair } from '@workspace/types';
import type { IssueSessionInput } from '../dto';

/**
 * Shared session-minting used by login/register/refresh. This is also the
 * single producer of the `auth.session.created` fact — every path that issues
 * a session emits it here, so no use-case has to remember to.
 */
@Injectable()
export class SessionIssuerService {
  constructor(
    @Inject(TOKEN_PORT_TOKEN) private readonly tokenPort: TokenPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepo: UserSessionRepositoryPort,
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN) private readonly authConfig: AuthRuntimeConfig,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
  ) {}

  async issue(input: IssueSessionInput): Promise<TokenPair> {
    const jti = generateId();
    const claims: AccessTokenClaims = { sub: input.userId, jti, userType: input.userType };

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenPort.signAccess(claims),
      this.tokenPort.signRefresh(claims),
    ]);

    const refreshTokenHash = await this.hashPort.hashToken(refreshToken);
    const expiresInSeconds = parseDurationToSeconds(this.authConfig.jwt.refreshExpiresIn);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Sessions are unique per (userId, deviceId) — one session per device.
    const existing = await this.sessionRepo.findByDevice(input.userId, input.deviceId);
    if (existing) {
      // Explicit RLS override: this runs before any JWT/RequestContext
      // exists (login/register/refresh), so getCurrentUser() has nothing to
      // read yet — input.userId is the real, already-resolved identity. See
      // docs/infrastructure/runbooks/db-rls-policies.sql's v5 entry (this
      // exact call caused the v3/v4 production incident).
      await this.sessionRepo.update(
        existing.id,
        {
          jti,
          refreshTokenHash,
          expiresAt,
          revokedAt: null,
          lastActiveAt: new Date(),
        },
        undefined,
        input.userId,
      );
    } else {
      await this.sessionRepo.create(
        {
          userId: input.userId,
          refreshTokenHash,
          jti,
          deviceId: input.deviceId,
          deviceName: input.deviceName ?? null,
          platform: input.platform ?? null,
          browser: input.browser ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          expiresAt,
        },
        undefined,
        input.userId,
      );
    }

    // Fact: a session was created (outbox — eventually consistent with the
    // session write above, which is already committed by here).
    await this.publisher.publish({
      eventType: AuthEvents.SESSION_CREATED,
      aggregateType: AggregateType.USER,
      aggregateId: input.userId,
      userId: input.userId,
      payload: {
        userId: input.userId,
        sessionId: jti,
        deviceId: input.deviceId,
        ipAddress: input.ipAddress ?? undefined,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseDurationToSeconds(this.authConfig.jwt.accessExpiresIn),
    };
  }
}

function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)?$/.exec(value.trim());
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = (match[2] ?? 's') as 's' | 'm' | 'h' | 'd';
  const multiplier: Record<'s' | 'm' | 'h' | 'd', number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * multiplier[unit];
}
