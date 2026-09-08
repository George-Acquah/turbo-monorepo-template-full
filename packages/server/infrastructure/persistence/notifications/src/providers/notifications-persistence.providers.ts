import type { Provider } from '@nestjs/common';
import {
  NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN,
  PRISMA_NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN,
  NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
  PRISMA_NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
  COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
  PRISMA_COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
  NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN,
  PRISMA_NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN,
  PUSH_DEVICE_REPOSITORY_TOKEN,
  PRISMA_PUSH_DEVICE_REPOSITORY_TOKEN,
  NOTIFICATION_STORE_TOKEN,
  IN_APP_NOTIFICATION_STORE_TOKEN,
  NOTIFICATION_DELIVERY_STORE_TOKEN,
} from '@workspace/ports';
import {
  PrismaNotificationTemplateAdapter,
  PrismaNotificationPreferenceAdapter,
  PrismaCommunicationPreferenceOverrideAdapter,
  PrismaNotificationChannelConfigAdapter,
  PrismaPushDeviceAdapter,
  MongoNotificationAdapter,
  MongoInAppNotificationAdapter,
  MongoNotificationDeliveryAdapter,
} from '../adapters';

export const NOTIFICATIONS_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaNotificationTemplateAdapter,
  {
    provide: PRISMA_NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN,
    useExisting: PrismaNotificationTemplateAdapter,
  },
  { provide: NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN, useExisting: PrismaNotificationTemplateAdapter },

  PrismaNotificationPreferenceAdapter,
  {
    provide: PRISMA_NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
    useExisting: PrismaNotificationPreferenceAdapter,
  },
  {
    provide: NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
    useExisting: PrismaNotificationPreferenceAdapter,
  },

  PrismaCommunicationPreferenceOverrideAdapter,
  {
    provide: PRISMA_COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
    useExisting: PrismaCommunicationPreferenceOverrideAdapter,
  },
  {
    provide: COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
    useExisting: PrismaCommunicationPreferenceOverrideAdapter,
  },

  PrismaNotificationChannelConfigAdapter,
  {
    provide: PRISMA_NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN,
    useExisting: PrismaNotificationChannelConfigAdapter,
  },
  {
    provide: NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN,
    useExisting: PrismaNotificationChannelConfigAdapter,
  },

  PrismaPushDeviceAdapter,
  { provide: PRISMA_PUSH_DEVICE_REPOSITORY_TOKEN, useExisting: PrismaPushDeviceAdapter },
  { provide: PUSH_DEVICE_REPOSITORY_TOKEN, useExisting: PrismaPushDeviceAdapter },

  MongoNotificationAdapter,
  { provide: NOTIFICATION_STORE_TOKEN, useExisting: MongoNotificationAdapter },

  MongoInAppNotificationAdapter,
  { provide: IN_APP_NOTIFICATION_STORE_TOKEN, useExisting: MongoInAppNotificationAdapter },

  MongoNotificationDeliveryAdapter,
  { provide: NOTIFICATION_DELIVERY_STORE_TOKEN, useExisting: MongoNotificationDeliveryAdapter },
];

export const NOTIFICATIONS_PERSISTENCE_TOKENS = [
  NOTIFICATION_TEMPLATE_REPOSITORY_TOKEN,
  NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
  COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
  NOTIFICATION_CHANNEL_CONFIG_REPOSITORY_TOKEN,
  PUSH_DEVICE_REPOSITORY_TOKEN,
  NOTIFICATION_STORE_TOKEN,
  IN_APP_NOTIFICATION_STORE_TOKEN,
  NOTIFICATION_DELIVERY_STORE_TOKEN,
];
