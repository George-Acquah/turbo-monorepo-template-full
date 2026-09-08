import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER_TOKEN,
  HASH_PORT_TOKEN,
  LOGGER_TOKEN,
  TRANSACTION_PORT_TOKEN,
  USER_REPOSITORY_TOKEN,
  type EventPublisherPort,
  type HashPort,
  type LoggerPort,
  type TransactionPort,
  type UserRepositoryPort,
} from '@workspace/ports';
import { AggregateType, UserStatus, UserType } from '@workspace/constants';
import { EmailAlreadyExistsException } from '@workspace/auth-core';
import { AuthEvents, type TokenPair } from '@workspace/types';
import { SessionIssuerService } from '../services/session-issuer.service';
import { RequestEmailVerificationUseCase } from './request-email-verification.use-case';
import type { RegisterInput } from '../dto';
import { formatWords } from '@workspace/utils/string';

@Injectable()
export class RegisterUseCase {
  private readonly context = RegisterUseCase.name;

  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    private readonly sessionIssuer: SessionIssuerService,
    private readonly requestEmailVerification: RequestEmailVerificationUseCase,
  ) {}

  async execute(input: RegisterInput): Promise<TokenPair> {
    const existing = await this.userRepo.findByEmail(input.email, { select: ['id'] });
    if (existing) {
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await this.hashPort.hashPassword(input.password);
    const displayName = formatWords(input.firstName, input.lastName);

    const user = await this.transactionPort.execute(async (tx) => {
      const created = await this.userRepo.create(
        {
          email: input.email,
          phone: null,
          userType: UserType.MEMBER,
          // ACTIVE (not PENDING_VERIFICATION): register auto-issues a
          // session, and the access token would be rejected by
          // JwtAccessStrategy if the user weren't ACTIVE. emailVerified
          // stays false; verification is a soft, dismissible reminder for
          // now (see RequestEmailVerificationUseCase below), not a gate.
          status: UserStatus.ACTIVE,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          displayName,
          avatarUrl: null,
          passwordHash,
          metadata: null,
        },
        tx,
      );

      // Fact: a user registered. Written to the outbox in the SAME transaction
      // as the user row — atomic (the event can't exist without the user, or
      // vice versa). Consumers (e.g. notifications: welcome email) react;
      // register does not know or care who they are.
      await this.publisher.publishWithTransaction(tx, {
        eventType: AuthEvents.USER_REGISTERED,
        aggregateType: AggregateType.USER,
        aggregateId: created.id,
        userId: created.id,
        payload: {
          userId: created.id,
          email: input.email,
          userType: created.userType,
          emailVerificationRequired: false,
        },
      });

      return created;
    });

    const tokens = await this.sessionIssuer.issue({
      userId: user.id,
      userType: user.userType,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform,
      browser: input.browser,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    // Best-effort: a verification-email hiccup (queue/SMTP down, etc.) must
    // never fail registration. The soft reminder banner (frontend) and the
    // resend endpoint both still work even if this particular send is lost.
    try {
      await this.requestEmailVerification.execute({
        userId: user.id,
        email: input.email,
        name: displayName || '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to enqueue verification email for user ${user.id}: ${message}`,
        this.context,
      );
    }

    return tokens;
  }
}
