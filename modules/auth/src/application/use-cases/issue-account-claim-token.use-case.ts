import { Inject, Injectable } from '@nestjs/common';
import {
  ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN,
  type AccountClaimTokenRepositoryPort,
  type AccountClaimTokenPersistence,
  HASH_PORT_TOKEN,
  type HashPort,
  LOGGER_TOKEN,
  type LoggerPort,
  QUEUE_BUS_TOKEN,
  type QueueBusPort,
} from '@workspace/ports';
import { BRANDING_RUNTIME_CONFIG_TOKEN, type BrandingRuntimeConfig } from '@workspace/ports/config';
import { EmailCategory, IdPrefixes, JobNames, QueueNames } from '@workspace/constants';
import { createIdentifier, generateId } from '@workspace/utils';
import type { EmailJobData } from '@workspace/types';
import type { IssueAccountClaimTokenInput } from '../dto';

const AccountClaimTokenId = createIdentifier(IdPrefixes.ACCOUNT_CLAIM_TOKEN);
const CLAIM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (doc 06 §5)

/**
 * Guest → account claim (doc 06 §5), issuance side. Called by
 * `SendAccountClaimOnEnrolmentActivatedHandler` when a guest-checkout
 * enrolment activates — the guest has only ever given an email, so this is
 * how they get into the member app: a "set up your account" link that lands
 * on `${portalUrl}/claim/<token>`, where they choose a password and are
 * signed in (`POST /v1/auth/claim` → `ClaimAccountUseCase`).
 *
 * Only the token hash is stored; the raw token is captured here at mint time
 * and goes straight into the email. It is enqueued directly onto
 * `EMAIL_QUEUE` via `QUEUE_BUS_TOKEN` (not an event) for the same reason
 * `RequestEmailVerificationUseCase` does: a raw token must never enter a
 * domain-event payload / the outbox / `modules/audit`'s permanent copy.
 */
@Injectable()
export class IssueAccountClaimTokenUseCase {
  private readonly context = IssueAccountClaimTokenUseCase.name;

  constructor(
    @Inject(ACCOUNT_CLAIM_TOKEN_REPOSITORY_TOKEN)
    private readonly claimTokenRepo: AccountClaimTokenRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(QUEUE_BUS_TOKEN) private readonly queueBus: QueueBusPort,
    @Inject(BRANDING_RUNTIME_CONFIG_TOKEN) private readonly branding: BrandingRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  async execute(
    input: IssueAccountClaimTokenInput,
  ): Promise<{ token: AccountClaimTokenPersistence; rawToken: string }> {
    const rawToken = await this.hashPort.generateSecureToken();
    const tokenHash = await this.hashPort.hashToken(rawToken);

    const token = await this.claimTokenRepo.create({
      id: AccountClaimTokenId.generate(),
      profileId: input.profileId,
      email: input.email,
      tokenHash,
      expiresAt: new Date(Date.now() + CLAIM_TOKEN_TTL_MS),
    });

    const claimUrl = `${this.branding.portalUrl.replace(/\/+$/, '')}/claim/${rawToken}`;

    const emailJobData: EmailJobData = {
      // Not backed by a Notification/NotificationDelivery row — same as
      // RequestEmailVerificationUseCase. EmailDeliveryAdapter only needs it
      // truthy.
      deliveryId: generateId(),
      to: { email: input.email },
      subject: 'Set up your Workspace account',
      template: 'account-claim',
      category: EmailCategory.SECURITY,
      context: {
        claimUrl,
        name: input.name ?? '',
        programmeName: input.programmeName ?? '',
        expiryDays: Math.round(CLAIM_TOKEN_TTL_MS / (24 * 60 * 60 * 1000)),
      },
    };

    try {
      await this.queueBus.enqueue(QueueNames.EMAIL_QUEUE, JobNames.SEND_EMAIL, emailJobData);
    } catch (err) {
      // The token is already persisted and valid for 7 days — a failed
      // enqueue shouldn't fail the caller (an event handler). Log and move
      // on; the member can be re-invited.
      this.logger.error(
        `Failed to enqueue account-claim email for profile ${input.profileId}`,
        err instanceof Error ? err.stack : undefined,
        this.context,
      );
    }

    return { token, rawToken };
  }
}
