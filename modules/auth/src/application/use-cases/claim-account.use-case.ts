import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN,
  type AccountClaimTokenRepositoryPort,
  USER_REPOSITORY_TOKEN,
  type UserRepositoryPort,
  HASH_PORT_TOKEN,
  type HashPort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AccountClaimTokenStatus, AggregateType, UserStatus, UserType } from '@workspace/constants';
import {
  ClaimAlreadyClaimedException,
  ClaimTokenExpiredException,
  ClaimTokenInvalidException,
} from '@workspace/auth-core';
import { AuthEvents, type TokenPair } from '@workspace/types';
import { SessionIssuerService } from '../services/session-issuer.service';
import type { ClaimAccountInput } from '../dto';

/**
 * Guest → account claim (doc 06 §5), completion side. `POST /v1/auth/claim`.
 *
 * Auth owns the token/verification mechanics and User creation here; the
 * effect on the guest-checkout `MemberProfile` (setting its `userId`) is
 * NOT done in this transaction — `modules/auth` cannot import
 * `modules/profiles`' ports directly (context-boundary ESLint rule). That
 * link happens asynchronously in `modules/profiles`, reacting to the
 * `AuthEvents.ACCOUNT_CLAIMED` fact this emits
 * (`LinkProfileOnAccountClaimedHandler`) — the only sanctioned cross-context
 * seam.
 */
@Injectable()
export class ClaimAccountUseCase {
  constructor(
    @Inject(ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN)
    private readonly claimTokenRepo: AccountClaimTokenRepositoryPort,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(input: ClaimAccountInput): Promise<TokenPair> {
    const tokenHash = await this.hashPort.hashToken(input.claimToken);
    const token = await this.claimTokenRepo.findByToken(tokenHash);
    if (!token) {
      throw new ClaimTokenInvalidException();
    }
    if (token.status !== AccountClaimTokenStatus.PENDING) {
      throw new ClaimAlreadyClaimedException();
    }
    if (token.expiresAt.getTime() < Date.now()) {
      throw new ClaimTokenExpiredException();
    }

    // doc 06 §5 point 4: a verified User with this email may already exist
    // (e.g. registered directly before their guest purchase was matched) —
    // link to it instead of minting a duplicate account.
    const existingUser = await this.userRepo.findByEmail(token.email, {
      select: ['id', 'userType', 'emailVerified'],
    });

    const userId = await this.transactionPort.execute(async (tx) => {
      let resolvedUserId: string;

      if (existingUser?.emailVerified) {
        resolvedUserId = existingUser.id;
      } else {
        const passwordHash = await this.hashPort.hashPassword(input.password);
        const created = await this.userRepo.create(
          {
            email: token.email,
            phone: null,
            userType: UserType.MEMBER,
            status: UserStatus.ACTIVE,
            // The claim token proves inbox control — no separate email
            // verification step needed, mirrors register.use-case's
            // reasoning for `status`.
            emailVerified: true,
            firstName: null,
            lastName: null,
            displayName: null,
            avatarUrl: null,
            passwordHash,
            metadata: null,
          },
          tx as DatabaseTx,
        );
        resolvedUserId = created.id;
      }

      await this.claimTokenRepo.markClaimed(token.id, resolvedUserId, tx as DatabaseTx);

      await this.publisher.publishWithTransaction(tx, {
        eventType: AuthEvents.ACCOUNT_CLAIMED,
        aggregateType: AggregateType.USER,
        aggregateId: resolvedUserId,
        userId: resolvedUserId,
        payload: {
          userId: resolvedUserId,
          profileId: token.profileId,
          email: token.email,
        },
      });

      return resolvedUserId;
    });

    return this.sessionIssuer.issue({
      userId,
      userType: UserType.MEMBER,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform,
      browser: input.browser,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
