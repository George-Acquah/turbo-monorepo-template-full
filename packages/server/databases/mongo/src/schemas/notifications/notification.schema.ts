import { HydratedDocument, Schema } from 'mongoose';

export interface NotificationAttemptPersistence {
  attemptNumber: number;
  status: string;
  providerId?: string | null;
  providerResponse?: Record<string, unknown> | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  createdAt: Date;
}

export interface NotificationPersistence {
  id: string;
  type: string;
  channel: string;
  templateId?: string | null;
  userId?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientDevice?: string | null;
  recipientSlack?: string | null;
  recipientTelegram?: string | null;
  subject?: string | null;
  title?: string | null;
  body: string;
  htmlBody?: string | null;
  data?: Record<string, unknown> | null;
  orderId?: string | null;
  batchId?: string | null;
  paymentId?: string | null;
  status: string;
  scheduledAt?: Date | null;
  queuedAt?: Date | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  failedAt?: Date | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  providerId?: string | null;
  providerResponse?: Record<string, unknown> | null;
  attempts: NotificationAttemptPersistence[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<NotificationPersistence>;

export const NotificationModelName = 'Notification';

const NotificationAttemptSchema = new Schema<NotificationAttemptPersistence>(
  {
    attemptNumber: { type: Number, required: true },
    status: { type: String, required: true },
    providerId: String,
    providerResponse: Schema.Types.Mixed,
    failureCode: String,
    failureMessage: String,
    createdAt: { type: Date, required: true },
  },
  {
    _id: false,
    id: false,
  },
);

export const NotificationSchema = new Schema<NotificationPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    channel: { type: String, required: true, index: true },
    templateId: String,
    userId: { type: String, index: true },
    recipientEmail: String,
    recipientPhone: String,
    recipientDevice: String,
    recipientSlack: String,
    recipientTelegram: String,
    subject: String,
    title: String,
    body: { type: String, required: true },
    htmlBody: String,
    data: Schema.Types.Mixed,
    orderId: { type: String, index: true },
    batchId: { type: String, index: true },
    paymentId: { type: String, index: true },
    status: { type: String, required: true, index: true },
    scheduledAt: Date,
    queuedAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    failedAt: Date,
    retryCount: { type: Number, required: true, default: 0 },
    maxRetries: { type: Number, required: true, default: 3 },
    nextRetryAt: Date,
    failureCode: String,
    failureMessage: String,
    providerId: String,
    providerResponse: Schema.Types.Mixed,
    attempts: { type: [NotificationAttemptSchema], required: true, default: [] },
    metadata: Schema.Types.Mixed,
  },
  {
    collection: 'notifications',
    timestamps: true,
    versionKey: false,
  },
);

NotificationSchema.index({ status: 1, scheduledAt: 1, nextRetryAt: 1 });
NotificationSchema.index({ type: 1, channel: 1 });
