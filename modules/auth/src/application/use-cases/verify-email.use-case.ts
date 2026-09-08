import { Inject, Injectable } from '@nestjs/common';
import {
  CACHE_PORT_TOKEN,
  type CachePort,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
  type EmailVerificationTokenRepositoryPort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  HASH_PORT_TOKEN,
  type HashPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  USER_REPOSITORY_TOKEN,
  type UserRepositoryPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType, RedisKeyPrefixes } from '@workspace/constants';
import {
  EmailVerificationTokenExpiredException,
  EmailVerificationTokenInvalidException,
} from '@workspace/auth-core';
import { AuthEvents } from '@workspace/types';
import type { VerifyEmailInput, VerifyEmailResult } from '../dto';
import { nowMs } from '@workspace/utils/date';

/**
 * Completion side of email verification. `POST /v1/auth/verify-email`
 * (public — no auth guard; a user may open the link from a different
 * browser/device with no session cookie present).
 *
 * The event this emits (`AuthEvents.EMAIL_VERIFIED`) carries only
 * `{ userId, email }` — never the raw token — so it's safe for the audit
 * wildcard subscriber to copy verbatim into `AuditLog.newValues`. Compare
 * to `RequestEmailVerificationUseCase`, which deliberately bypasses the
 * outbox for the raw-token-bearing email send.
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN)
    private readonly emailVerificationTokenRepo: EmailVerificationTokenRepositoryPort,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
  ) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailResult> {
    const tokenHash = await this.hashPort.hashToken(input.rawToken);
    const token = await this.emailVerificationTokenRepo.findByTokenHash(tokenHash);

    if (!token || token.usedAt) {
      throw new EmailVerificationTokenInvalidException();
    }
    if (token.expiresAt.getTime() < nowMs()) {
      throw new EmailVerificationTokenExpiredException();
    }

    await this.transactionPort.execute(async (tx) => {
      await this.emailVerificationTokenRepo.markAsUsed(token.id, tx as DatabaseTx);
      await this.userRepo.updateSecurity(
        token.userId,
        { emailVerified: true, emailVerifiedAt: new Date() },
        tx as DatabaseTx,
      );

      await this.publisher.publishWithTransaction(tx, {
        eventType: AuthEvents.EMAIL_VERIFIED,
        aggregateType: AggregateType.USER,
        aggregateId: token.userId,
        userId: token.userId,
        payload: {
          userId: token.userId,
          email: token.email,
        },
      });
    });

    // Evict the cached GET /me response so the frontend's dismissible
    // reminder disappears immediately rather than waiting out the cache TTL.
    await this.cache.deleteEntity(RedisKeyPrefixes.IDENTITY.USER, token.userId);

    return { email: token.email };
  }
}
