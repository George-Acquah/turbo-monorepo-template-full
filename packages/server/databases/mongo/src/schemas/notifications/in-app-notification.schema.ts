import { HydratedDocument, Schema } from 'mongoose';

export interface InAppNotificationPersistence {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  imageUrl?: string | null;
  orderId?: string | null;
  batchId?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  isDismissed: boolean;
  dismissedAt?: Date | null;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InAppNotificationDocument = HydratedDocument<InAppNotificationPersistence>;

export const InAppNotificationModelName = 'InAppNotification';

export const InAppNotificationSchema = new Schema<InAppNotificationPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    actionUrl: String,
    imageUrl: String,
    orderId: String,
    batchId: String,
    isRead: { type: Boolean, required: true, default: false },
    readAt: Date,
    isDismissed: { type: Boolean, required: true, default: false },
    dismissedAt: Date,
    expiresAt: { type: Date, index: true },
    metadata: Schema.Types.Mixed,
  },
  {
    collection: 'in_app_notifications',
    timestamps: true,
    versionKey: false,
  },
);

InAppNotificationSchema.index({ userId: 1, isRead: 1 });
