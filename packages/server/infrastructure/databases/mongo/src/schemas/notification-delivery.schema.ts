import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  NotificationDeliveryStatus,
  NotificationProvider,
  NotificationProviderChannel,
} from '@workspace/constants';
import { MongoCollections } from '../client/mongo.tokens';

export type NotificationDeliveryDocument = HydratedDocument<NotificationDelivery>;

/**
 * Per-channel delivery ATTEMPT log for a Notification.
 *
 * Aligns with NotificationDeliveryPersistence in the notification ports. One row
 * per provider send attempt; carries the provider message id for
 * bounce/complaint correlation. `_id` holds the cuid2 id (ntd_*).
 */
@Schema({
  collection: MongoCollections.NOTIFICATION_DELIVERIES,
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class NotificationDelivery {
  @Prop({ type: String, required: true })
  _id!: string; // ntd_*

  @Prop({ type: String, required: true, index: true })
  notificationId!: string;

  @Prop({ type: String, required: true, enum: Object.values(NotificationProvider) })
  provider!: NotificationProvider;

  @Prop({ type: String, required: true, enum: Object.values(NotificationProviderChannel) })
  channel!: NotificationProviderChannel;

  @Prop({ type: Number, required: true })
  attemptNumber!: number;

  @Prop({ type: String })
  providerMessageId?: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(NotificationDeliveryStatus),
    default: NotificationDeliveryStatus.PENDING,
  })
  status!: NotificationDeliveryStatus;

  @Prop({ type: String })
  errorCode?: string;

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: Object })
  requestPayload?: Record<string, unknown>;

  @Prop({ type: Object })
  responsePayload?: Record<string, unknown>;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  failedAt?: Date;
}

export const NotificationDeliverySchema = SchemaFactory.createForClass(NotificationDelivery);

// Exactly one row per (notification, attempt).
NotificationDeliverySchema.index({ notificationId: 1, attemptNumber: 1 }, { unique: true });
NotificationDeliverySchema.index({ providerMessageId: 1 }, { sparse: true });
