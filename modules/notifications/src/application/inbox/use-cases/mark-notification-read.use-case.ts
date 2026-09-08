import { Inject, Injectable } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_STORE_TOKEN,
  type InAppNotificationStorePort,
} from '@workspace/ports';
import { NotificationAccessDeniedException, NotificationNotFoundException } from '../errors';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_STORE_TOKEN)
    private readonly inAppNotifications: InAppNotificationStorePort,
  ) {}

  async execute(userId: string, notificationId: string): Promise<void> {
    const notification = await this.inAppNotifications.findById(notificationId);
    if (!notification) {
      throw new NotificationNotFoundException();
    }

    // Mandatory ownership check — markRead(id) has no owner filter, so without this any
    // authenticated user could mark another user's notification read (IDOR). Every row this
    // module's list/count surface (listForUser/countForUser) is userId-keyed, but profileId is
    // checked too defensively in case a profile-keyed row is ever looked up by id here.
    if (notification.userId !== userId && notification.profileId !== userId) {
      throw new NotificationAccessDeniedException();
    }

    await this.inAppNotifications.markRead(notificationId);
  }
}
