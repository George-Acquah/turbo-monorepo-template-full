import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  IN_APP_NOTIFICATION_STORE_TOKEN,
  NOTIFICATION_CONFIG_STORE_TOKEN,
  NOTIFICATION_DELIVERY_STORE_TOKEN,
  NOTIFICATION_TEMPLATE_STORE_TOKEN,
  PUSH_DEVICE_STORE_TOKEN,
} from '@repo/ports';
import { MONGO_CONNECTION_NAME } from '../tokens/mongo.tokens';
import {
  InAppNotificationModelName,
  InAppNotificationSchema,
} from '../schemas/notifications/in-app-notification.schema';
import {
  NotificationConfigModelName,
  NotificationConfigSchema,
} from '../schemas/notifications/notification-config.schema';
import {
  NotificationModelName,
  NotificationSchema,
} from '../schemas/notifications/notification.schema';
import {
  NotificationTemplateModelName,
  NotificationTemplateSchema,
} from '../schemas/notifications/notification-template.schema';
import {
  PushDeviceModelName,
  PushDeviceSchema,
} from '../schemas/notifications/push-device.schema';
import {
  MongoInAppNotificationStoreAdapter,
  MongoNotificationConfigStoreAdapter,
  MongoNotificationDeliveryStoreAdapter,
  MongoNotificationTemplateStoreAdapter,
  MongoPushDeviceStoreAdapter,
} from '../adapters/notifications';
import { MongoModule } from '../mongo.module';

const notificationModels = [
  { name: NotificationTemplateModelName, schema: NotificationTemplateSchema },
  { name: NotificationModelName, schema: NotificationSchema },
  { name: InAppNotificationModelName, schema: InAppNotificationSchema },
  { name: PushDeviceModelName, schema: PushDeviceSchema },
  { name: NotificationConfigModelName, schema: NotificationConfigSchema },
];

const notificationFeatureModule = MONGO_CONNECTION_NAME
  ? MongooseModule.forFeature(notificationModels, MONGO_CONNECTION_NAME)
  : MongooseModule.forFeature(notificationModels);

@Global()
@Module({
  imports: [MongoModule, notificationFeatureModule],
  providers: [
    MongoNotificationTemplateStoreAdapter,
    MongoNotificationDeliveryStoreAdapter,
    MongoInAppNotificationStoreAdapter,
    MongoPushDeviceStoreAdapter,
    MongoNotificationConfigStoreAdapter,
    {
      provide: NOTIFICATION_TEMPLATE_STORE_TOKEN,
      useExisting: MongoNotificationTemplateStoreAdapter,
    },
    {
      provide: NOTIFICATION_DELIVERY_STORE_TOKEN,
      useExisting: MongoNotificationDeliveryStoreAdapter,
    },
    {
      provide: IN_APP_NOTIFICATION_STORE_TOKEN,
      useExisting: MongoInAppNotificationStoreAdapter,
    },
    {
      provide: PUSH_DEVICE_STORE_TOKEN,
      useExisting: MongoPushDeviceStoreAdapter,
    },
    {
      provide: NOTIFICATION_CONFIG_STORE_TOKEN,
      useExisting: MongoNotificationConfigStoreAdapter,
    },
  ],
  exports: [
    NOTIFICATION_TEMPLATE_STORE_TOKEN,
    NOTIFICATION_DELIVERY_STORE_TOKEN,
    IN_APP_NOTIFICATION_STORE_TOKEN,
    PUSH_DEVICE_STORE_TOKEN,
    NOTIFICATION_CONFIG_STORE_TOKEN,
  ],
})
export class MongoNotificationsStoreModule {}
