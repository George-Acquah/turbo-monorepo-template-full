import { Inject, Injectable } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_STORE_TOKEN,
  type InAppNotificationStorePort,
} from '@workspace/ports';
import { NotificationAccessDeniedException, NotificationNotFoundException } from '../errors';

@Injectable()
export class ArchiveNotificationUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_STORE_TOKEN)
    private readonly inAppNotifications: InAppNotificationStorePort,
  ) {}

  async execute(userId: string, notificationId: string): Promise<void> {
    const notification = await this.inAppNotifications.findById(notificationId);
    if (!notification) {
      throw new NotificationNotFoundException();
    }

    // Mandatory ownership check — archive(id) has no owner filter, so without this any
    // authenticated user could archive another user's notification (IDOR). See
    // MarkNotificationReadUseCase for the same shape.
    if (notification.userId !== userId && notification.profileId !== userId) {
      throw new NotificationAccessDeniedException();
    }

    await this.inAppNotifications.archive(notificationId);
  }
}
