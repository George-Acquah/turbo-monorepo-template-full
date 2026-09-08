import { Module } from '@nestjs/common';
import { NotificationsPersistenceModule } from '@workspace/notifications-persistence';
import { GetMyNotificationPreferencesUseCase } from './application/preferences/use-cases/get-my-notification-preferences.use-case';
import { UpdateMyNotificationPreferenceUseCase } from './application/preferences/use-cases/update-my-notification-preference.use-case';
import { ListMyNotificationsUseCase } from './application/inbox/use-cases/list-my-notifications.use-case';
import { GetMyUnreadCountUseCase } from './application/inbox/use-cases/get-my-unread-count.use-case';
import { MarkNotificationReadUseCase } from './application/inbox/use-cases/mark-notification-read.use-case';
import { ArchiveNotificationUseCase } from './application/inbox/use-cases/archive-notification.use-case';
import { MarkAllNotificationsReadUseCase } from './application/inbox/use-cases/mark-all-notifications-read.use-case';
import { NotificationPreferencesController } from './presentation/controllers/notification-preferences.controller';
import { NotificationsController } from './presentation/controllers/notifications.controller';

/**
 * HTTP composition root — imported by apps/api. Distinct from
 * `NotificationsWorkerModule` (apps/worker), which owns the event handlers and dispatch service:
 * this half only reads/writes preferences and the caller's own in-app inbox (list/unread-count/
 * mark-read/archive/mark-all-read), so it needs neither the queue consumer nor the delivery ports.
 *
 * Sending remains worker-side; nothing here dispatches a notification.
 * `NotificationsPersistenceModule` is not `@Global()`, so it's imported here explicitly — same
 * pattern as ProfilesModule.
 */
@Module({
  imports: [NotificationsPersistenceModule],
  controllers: [NotificationPreferencesController, NotificationsController],
  providers: [
    GetMyNotificationPreferencesUseCase,
    UpdateMyNotificationPreferenceUseCase,
    ListMyNotificationsUseCase,
    GetMyUnreadCountUseCase,
    MarkNotificationReadUseCase,
    ArchiveNotificationUseCase,
    MarkAllNotificationsReadUseCase,
  ],
})
export class NotificationsModule {}
