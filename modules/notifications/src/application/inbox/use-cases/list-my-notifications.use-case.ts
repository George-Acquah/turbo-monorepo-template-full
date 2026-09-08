import { Inject, Injectable } from '@nestjs/common';
import {
  IN_APP_NOTIFICATION_STORE_TOKEN,
  type InAppNotificationPersistence,
  type InAppNotificationStorePort,
} from '@workspace/ports';

export interface ListMyNotificationsInput {
  unreadOnly?: boolean;
  archived?: boolean;
  skip?: number;
  take?: number;
}

export interface ListMyNotificationsResult {
  total: number;
  items: InAppNotificationPersistence[];
}

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    @Inject(IN_APP_NOTIFICATION_STORE_TOKEN)
    private readonly inAppNotifications: InAppNotificationStorePort,
  ) {}

  async execute(userId: string, input: ListMyNotificationsInput = {}): Promise<ListMyNotificationsResult> {
    const { unreadOnly, archived, skip, take } = input;

    // Store-port list options are named `limit`/`offset`, not `skip`/`take` — mapped here so the
    // use-case's HTTP-facing vocabulary (query dto) stays consistent with the rest of this codebase's
    // paginated endpoints.
    const [items, total] = await Promise.all([
      this.inAppNotifications.listForUser(userId, {
        unreadOnly,
        archived,
        offset: skip,
        limit: take,
      }),
      this.inAppNotifications.countForUser(userId, { unreadOnly, archived }),
    ]);

    return { total, items };
  }
}
