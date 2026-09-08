import {
  CreateInAppNotificationInput,
  InAppNotificationPersistence,
  InAppNotificationPersistenceQueryOptions,
} from './notification.types';

export abstract class InAppNotificationStorePort {
  abstract create<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    data: CreateInAppNotificationInput,
    options?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K>>;

  /** Bulk insert — the catalog-creation broadcast fan-out's primitive (one
   * feed entry per recipient, hundreds/thousands at once) without N
   * individual round trips. */
  abstract createMany(inputs: CreateInAppNotificationInput[]): Promise<void>;

  abstract findById<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    id: string,
    options?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K> | null>;

  abstract listForProfile<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    profileId: string,
    listOptions?: {
      unreadOnly?: boolean;
      archived?: boolean;
      limit?: number;
      offset?: number;
    },
    queryOptions?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K>[]>;

  abstract countForProfile(
    profileId: string,
    options?: {
      unreadOnly?: boolean;
      archived?: boolean;
    },
  ): Promise<number>;

  /** Staff/admin feed (userId-keyed) — mirrors listForProfile for recipients
   * with no MemberProfile. */
  abstract listForUser<
    K extends keyof InAppNotificationPersistence = keyof InAppNotificationPersistence,
  >(
    userId: string,
    listOptions?: {
      unreadOnly?: boolean;
      archived?: boolean;
      limit?: number;
      offset?: number;
    },
    queryOptions?: InAppNotificationPersistenceQueryOptions<K>,
  ): Promise<Pick<InAppNotificationPersistence, K>[]>;

  abstract countForUser(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      archived?: boolean;
    },
  ): Promise<number>;

  abstract markRead(inAppId: string, readAt?: Date): Promise<void>;

  abstract archive(inAppId: string, archivedAt?: Date): Promise<void>;

  abstract markAllRead(profileId: string): Promise<number>;

  /** Staff/admin feed (userId-keyed) — mirrors markAllRead for recipients with no MemberProfile.
   * `markAllRead` only matches profileId-keyed rows, so it would silently mark zero rows for
   * userId-only recipients (e.g. identity's RBAC notifications, billing/memberships events
   * dispatched before a profile is known). */
  abstract markAllReadForUser(userId: string): Promise<number>;
}

export const IN_APP_NOTIFICATION_STORE_TOKEN = Symbol('IN_APP_NOTIFICATION_STORE_TOKEN');
