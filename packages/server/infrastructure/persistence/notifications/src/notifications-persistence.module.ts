import { Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import { MongoModule } from '@workspace/mongo';
import {
  NotificationTemplateQuery,
  NotificationPreferenceQuery,
  CommunicationPreferenceOverrideQuery,
  NotificationChannelConfigQuery,
  PushDeviceQuery,
  NotificationQuery,
  InAppNotificationQuery,
  NotificationDeliveryQuery,
} from './queries';
import { NOTIFICATIONS_PERSISTENCE_ADAPTERS, NOTIFICATIONS_PERSISTENCE_TOKENS } from './providers';

export * from './queries';
export * from './converter';
export * from './adapters';

/**
 * Implements the workspace_notifications ports against a hybrid store:
 * templates/preferences/overrides/channel-config/push-devices are low-volume
 * relational config in Prisma; notification instances, per-channel delivery
 * logs, and the in-app feed are high-volume, document-shaped records in
 * MongoDB (@workspace/mongo). Config-vs-records split per doc 04.
 */
@Module({
  imports: [PrismaModule, MongoModule],
  providers: [
    NotificationTemplateQuery,
    NotificationPreferenceQuery,
    CommunicationPreferenceOverrideQuery,
    NotificationChannelConfigQuery,
    PushDeviceQuery,
    NotificationQuery,
    InAppNotificationQuery,
    NotificationDeliveryQuery,
    ...NOTIFICATIONS_PERSISTENCE_ADAPTERS,
  ],
  exports: [...NOTIFICATIONS_PERSISTENCE_TOKENS],
})
export class NotificationsPersistenceModule {}
