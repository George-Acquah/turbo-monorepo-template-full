import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_DELIVERY_PORT, type EmailDeliveryPort, type QueueJobProcessor } from '@workspace/ports';
import type { EmailJobData } from '@workspace/types';

/**
 * `createQueueConsumer`-backed (not `WorkspaceEventHandlerPort`) — consumes
 * `QueueNames.EMAIL_QUEUE` jobs enqueued directly by
 * `RequestEmailVerificationUseCase` (bypassing the outbox/audit pipeline on
 * purpose, see that use-case's doc comment). Mirrors
 * `modules/memberships`' `ScanSubscriptionRenewalsProcessor` shape exactly.
 */
@Injectable()
export class SendEmailJobProcessor implements QueueJobProcessor<EmailJobData> {
  constructor(@Inject(EMAIL_DELIVERY_PORT) private readonly emailDelivery: EmailDeliveryPort) {}

  async process(data: EmailJobData): Promise<void> {
    await this.emailDelivery.send(data);
  }
}
