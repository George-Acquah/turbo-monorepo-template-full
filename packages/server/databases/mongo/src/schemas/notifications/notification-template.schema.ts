import { HydratedDocument, Schema } from 'mongoose';

export interface NotificationTemplatePersistence {
  id: string;
  name: string;
  slug: string;
  type: string;
  channels: string[];
  emailSubject?: string | null;
  emailHtml?: string | null;
  emailText?: string | null;
  smsBody?: string | null;
  pushTitle?: string | null;
  pushBody?: string | null;
  pushData?: Record<string, unknown> | null;
  inAppTitle?: string | null;
  inAppBody?: string | null;
  inAppAction?: string | null;
  slackMessage?: Record<string, unknown> | null;
  telegramMessage?: string | null;
  whatsappTemplateId?: string | null;
  whatsappParams?: Record<string, unknown> | null;
  variables: string[];
  isActive: boolean;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationTemplateDocument = HydratedDocument<NotificationTemplatePersistence>;

export const NotificationTemplateModelName = 'NotificationTemplate';

export const NotificationTemplateSchema = new Schema<NotificationTemplatePersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, required: true, index: true },
    channels: { type: [String], required: true, default: [] },
    emailSubject: String,
    emailHtml: String,
    emailText: String,
    smsBody: String,
    pushTitle: String,
    pushBody: String,
    pushData: Schema.Types.Mixed,
    inAppTitle: String,
    inAppBody: String,
    inAppAction: String,
    slackMessage: Schema.Types.Mixed,
    telegramMessage: String,
    whatsappTemplateId: String,
    whatsappParams: Schema.Types.Mixed,
    variables: { type: [String], required: true, default: [] },
    isActive: { type: Boolean, required: true, default: true, index: true },
    description: String,
    metadata: Schema.Types.Mixed,
    deletedAt: Date,
  },
  {
    collection: 'notification_templates',
    timestamps: true,
    versionKey: false,
  },
);
