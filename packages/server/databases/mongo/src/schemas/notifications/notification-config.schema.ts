import { HydratedDocument, Schema } from 'mongoose';

export interface NotificationConfigPersistence {
  id: string;
  channel: string;
  provider: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  fromPhone?: string | null;
  slackWebhook?: string | null;
  telegramBotToken?: string | null;
  rateLimit?: number | null;
  dailyLimit?: number | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationConfigDocument = HydratedDocument<NotificationConfigPersistence>;

export const NotificationConfigModelName = 'NotificationConfig';

export const NotificationConfigSchema = new Schema<NotificationConfigPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    channel: { type: String, required: true, unique: true },
    provider: { type: String, required: true },
    apiKey: String,
    apiSecret: String,
    fromEmail: String,
    fromName: String,
    fromPhone: String,
    slackWebhook: String,
    telegramBotToken: String,
    rateLimit: Number,
    dailyLimit: Number,
    isActive: { type: Boolean, required: true, default: true, index: true },
    metadata: Schema.Types.Mixed,
  },
  {
    collection: 'notification_configs',
    timestamps: true,
    versionKey: false,
  },
);
