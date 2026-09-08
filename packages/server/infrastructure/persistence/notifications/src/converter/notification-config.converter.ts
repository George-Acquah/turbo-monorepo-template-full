import type {
  NotificationTemplateChannel,
  NotificationPreferenceChannel,
  CommunicationPreferenceOverrideReason,
  NotificationProviderChannel,
  PushDevicePlatform,
} from '@workspace/constants';
import type {
  NotificationTemplatePersistence,
  NotificationPreferencePersistence,
  CommunicationPreferenceOverridePersistence,
  NotificationChannelConfigPersistence,
  PushDevicePersistence,
} from '@workspace/ports';
import type {
  NotificationTemplate as PrismaNotificationTemplate,
  NotificationPreference as PrismaNotificationPreference,
  CommunicationPreferenceOverride as PrismaCommunicationPreferenceOverride,
  NotificationChannelConfig as PrismaNotificationChannelConfig,
  PushDevice as PrismaPushDevice,
} from '@workspace/prisma/client';

// channel/reason/platform are String columns with /// @check doc-comments
// (not native Prisma enums), so they need the same narrowing UserConverter
// does for auth.User.userType/status.
export const NotificationConfigConverter = {
  toTemplatePersistence(row: PrismaNotificationTemplate): NotificationTemplatePersistence {
    return {
      ...row,
      channel: row.channel as NotificationTemplateChannel,
      variables: (row.variables as Record<string, unknown> | null) ?? null,
    };
  },

  toTemplatePartialPersistence(
    row: Partial<PrismaNotificationTemplate>,
  ): Partial<NotificationTemplatePersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('channel' in row) result.channel = row.channel as NotificationTemplateChannel;
    if ('variables' in row) result.variables = (row.variables as Record<string, unknown> | null) ?? null;
    return result;
  },

  toPreferencePersistence(row: PrismaNotificationPreference): NotificationPreferencePersistence {
    return { ...row, channel: row.channel as NotificationPreferenceChannel };
  },

  toPreferencePartialPersistence(
    row: Partial<PrismaNotificationPreference>,
  ): Partial<NotificationPreferencePersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('channel' in row) result.channel = row.channel as NotificationPreferenceChannel;
    return result;
  },

  toOverridePersistence(
    row: PrismaCommunicationPreferenceOverride,
  ): CommunicationPreferenceOverridePersistence {
    return { ...row, reason: row.reason as CommunicationPreferenceOverrideReason };
  },

  toOverridePartialPersistence(
    row: Partial<PrismaCommunicationPreferenceOverride>,
  ): Partial<CommunicationPreferenceOverridePersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('reason' in row) result.reason = row.reason as CommunicationPreferenceOverrideReason;
    return result;
  },

  toChannelConfigPersistence(
    row: PrismaNotificationChannelConfig,
  ): NotificationChannelConfigPersistence {
    return {
      ...row,
      channel: row.channel as NotificationProviderChannel,
      settings: (row.settings as Record<string, unknown> | null) ?? null,
    };
  },

  toChannelConfigPartialPersistence(
    row: Partial<PrismaNotificationChannelConfig>,
  ): Partial<NotificationChannelConfigPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('channel' in row) result.channel = row.channel as NotificationProviderChannel;
    if ('settings' in row) result.settings = (row.settings as Record<string, unknown> | null) ?? null;
    return result;
  },

  toPushDevicePersistence(row: PrismaPushDevice): PushDevicePersistence {
    return { ...row, platform: row.platform as PushDevicePlatform };
  },

  toPushDevicePartialPersistence(row: Partial<PrismaPushDevice>): Partial<PushDevicePersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('platform' in row) result.platform = row.platform as PushDevicePlatform;
    return result;
  },
};
