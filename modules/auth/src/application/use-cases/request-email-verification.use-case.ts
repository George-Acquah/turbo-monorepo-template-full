import { Inject, Injectable } from '@nestjs/common';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN,
  type EmailVerificationTokenRepositoryPort,
  HASH_PORT_TOKEN,
  type HashPort,
  QUEUE_BUS_TOKEN,
  type QueueBusPort,
} from '@workspace/ports';
import { BRANDING_RUNTIME_CONFIG_TOKEN, type BrandingRuntimeConfig } from '@workspace/ports/config';
import { EmailCategory, IdPrefixes, JobNames, QueueNames } from '@workspace/constants';
import { createIdentifier, generateId } from '@workspace/utils';
import type { EmailJobData } from '@workspace/types';
import type { RequestEmailVerificationInput } from '../dto';
import { now } from '@workspace/utils/date';

const EmailVerificationTokenId = createIdentifier(IdPrefixes.EMAIL_VERIFICATION);
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Issuance side of email verification. `POST /v1/auth/verify-email/resend`,
 * plus a best-effort fire from `RegisterUseCase` right after signup.
 *
 * Deliberately injects `QUEUE_BUS_TOKEN` (not `EVENT_PUBLISHER_TOKEN`): the
 * raw verification token must never be placed in a `WorkspaceEvent` payload,
 * since `modules/audit`'s wildcard subscriber copies every domain event's
 * payload verbatim into the permanently-retained `AuditLog.newValues`
 * column — a raw token there would be a real secret leak into a
 * staff-readable table. Enqueuing straight onto `QueueNames.EMAIL_QUEUE`
 * bypasses the outbox/audit pipeline entirely for this one send, mirroring
 * `modules/memberships`' `SCHEDULED_JOBS` precedent
 * (`memberships.worker.module.ts` / `ScanSubscriptionRenewalsProcessor`) —
 * a plain job processor, not a `WorkspaceEventHandlerPort`.
 */
@Injectable()
export class RequestEmailVerificationUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY_TOKEN)
    private readonly emailVerificationTokenRepo: EmailVerificationTokenRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(QUEUE_BUS_TOKEN) private readonly queueBus: QueueBusPort,
    @Inject(BRANDING_RUNTIME_CONFIG_TOKEN) private readonly branding: BrandingRuntimeConfig,
  ) {}

  async execute(input: RequestEmailVerificationInput): Promise<void> {
    // Single-active-token discipline, mirrors IssueAccountClaimTokenUseCase's
    // sibling flow: only the most recently issued token should be usable.
    await this.emailVerificationTokenRepo.invalidateAllForUser(input.userId);

    const rawToken = await this.hashPort.generateSecureToken();
    const tokenHash = await this.hashPort.hashToken(rawToken);

    await this.emailVerificationTokenRepo.create({
      id: EmailVerificationTokenId.generate(),
      userId: input.userId,
      email: input.email,
      tokenHash,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const verificationUrl = `${this.branding.portalUrl.replace(/\/+$/, '')}/verify-email/${rawToken}`;

    const emailJobData: EmailJobData = {
      // Satisfies EmailJobData's contract only — this send doesn't create a
      // tracked Notification/NotificationDelivery row the way
      // NotificationDispatchService does, so there is no delivery record
      // behind this id. EmailDeliveryAdapter.send() just requires it to be
      // truthy; don't go looking for a row that was never created.
      deliveryId: generateId(),
      to: { email: input.email },
      subject: 'Verify your email address',
      template: 'email-verification',
      category: EmailCategory.SECURITY,
      context: {
        verificationCode: rawToken,
        verificationUrl,
        expiryMinutes: Math.round(VERIFICATION_TOKEN_TTL_MS / 60000),
        year: now().getFullYear(),
        name: input.name || '',
      },
    };

    await this.queueBus.enqueue(QueueNames.EMAIL_QUEUE, JobNames.SEND_EMAIL, emailJobData);
  }
}
