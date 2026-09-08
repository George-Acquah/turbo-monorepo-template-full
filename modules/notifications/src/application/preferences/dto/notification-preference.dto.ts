import type {
  ConfigurableNotificationChannel,
  NotificationCategory,
} from '@workspace/constants';

/** One cell of the category × channel matrix. */
export interface NotificationPreferenceEntry {
  category: NotificationCategory;
  channel: ConfigurableNotificationChannel;
  enabled: boolean;
  /**
   * True when an active `CommunicationPreferenceOverride` forces delivery for this category. The
   * dispatcher ignores the stored preference in that case, so the UI must render this as
   * always-on rather than as a toggle that appears to work and doesn't.
   */
  locked: boolean;
  /** Why it's locked — COMPLIANCE | FINANCIAL | LEGAL | SECURITY | SYSTEM. Null when unlocked. */
  lockedReason: string | null;
}

export interface MyNotificationPreferences {
  entries: NotificationPreferenceEntry[];
}

export interface UpdateNotificationPreferenceInput {
  category: string;
  channel: string;
  enabled: boolean;
}
