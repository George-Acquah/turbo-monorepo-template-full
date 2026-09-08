import { Notification, NotificationSchema } from './notification.schema';
import {
  NotificationDelivery,
  NotificationDeliverySchema,
} from './notification-delivery.schema';
import { InAppNotification, InAppNotificationSchema } from './in-app-notification.schema';

export * from './notification.schema';
export * from './notification-delivery.schema';
export * from './in-app-notification.schema';

// The model definitions registered via MongooseModule.forFeature. The model is
// registered under the class name; the collection comes from @Schema({ collection }).
export const MONGO_MODELS = [
  { name: Notification.name, schema: NotificationSchema },
  { name: NotificationDelivery.name, schema: NotificationDeliverySchema },
  { name: InAppNotification.name, schema: InAppNotificationSchema },
];
