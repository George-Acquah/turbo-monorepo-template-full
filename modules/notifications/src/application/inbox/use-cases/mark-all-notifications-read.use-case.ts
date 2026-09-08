import { Inject, Injectable } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_STORE_TOKEN,
  type InAppNotificationStorePort,
} from '@workspace/ports';

export interface MarkAllNotificationsReadResult {
  count: number;
}

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_STORE_TOKEN)
    private readonly inAppNotifications: InAppNotificationStorePort,
  ) {}

  async execute(userId: string): Promise<MarkAllNotificationsReadResult> {
    const count = await this.inAppNotifications.markAllReadForUser(userId);
    return { count };
  }
}
