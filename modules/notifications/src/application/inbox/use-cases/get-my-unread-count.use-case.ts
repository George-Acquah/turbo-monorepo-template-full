import { Inject, Injectable } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_STORE_TOKEN,
  type InAppNotificationStorePort,
} from '@workspace/ports';

@Injectable()
export class GetMyUnreadCountUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_STORE_TOKEN)
    private readonly inAppNotifications: InAppNotificationStorePort,
  ) {}

  execute(userId: string): Promise<number> {
    return this.inAppNotifications.countForUser(userId, { unreadOnly: true });
  }
}
