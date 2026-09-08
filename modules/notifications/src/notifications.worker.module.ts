import { Module } from '@nestjs/common';
import { NotificationsPersistenceModule } from '@workspace/notifications-persistence';
import { QueueModule, createDomainEventConsumer } from '@workspace/queue';
import { QueueNames } from '@workspace/constants';
import {
  notificationsEventHandlerProviders,
  NOTIFICATIONS_EVENT_HANDLERS,
} from './infrastructure/event-handlers/providers';
import { NotificationDispatchService } from './application/services/notification-dispatch.service';

/**
 * Worker composition root — notifications is worker-only (no HTTP root/routes
 * here; member self-service preferences live in `NotificationsModule`, the
 * apps/api half). Imported by apps/worker, never apps/api.
 *
 * `EMAIL_DELIVERY_PORT`/`SMS_DELIVERY_PORT`/`PUSH_DELIVERY_PORT`/
 * `WHATSAPP_DELIVERY_PORT` come from `@workspace/email`/`@workspace/sms`/
 * `@workspace/push`/`@workspace/whatsapp` (all `@Global()`, all imported by
 * apps/worker) — not imported here.
 *
 * TEMPLATE NOTE: a broadcast/fan-out work queue (`createQueueConsumer` + a
 * processor enqueuing onto it directly via `QueueBusPort`) was removed with
 * the business handlers — add one back the same way if you need catalog-style
 * broadcasts.
 */
@Module({
  imports: [
    NotificationsPersistenceModule,
    QueueModule.registerQueues([{ name: QueueNames.NOTIFICATIONS_EVENTS }]),
  ],
  providers: [
    NotificationDispatchService,
    ...notificationsEventHandlerProviders,
    createDomainEventConsumer(QueueNames.NOTIFICATIONS_EVENTS, NOTIFICATIONS_EVENT_HANDLERS),
  ],
})
export class NotificationsWorkerModule {}
