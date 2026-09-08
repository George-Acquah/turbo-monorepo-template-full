import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '@workspace/constants';
import { MongoCollections } from '../client/mongo.tokens';

export type NotificationDocument = HydratedDocument<Notification>;

/**
 * Notification RECORD (one per dispatched notification).
 *
 * Aligns with NotificationPersistence in
 * ports/src/database/schema/notifications/notification.types.ts. Usually
 * keyed on `profileId` (not `userId`) so guest-checkout notifications work
 * before an auth account exists; `userId` is carried too, populated once the
 * profile is claimed. Staff/admin recipients (identity's RBAC events) have no
 * MemberProfile at all, so `profileId` is optional and `userId` carries the
 * record instead — at least one of the two is required, enforced by
 * NotificationDispatchService, not this schema.
 *
 * `_id` holds the cuid2 id (ntf_*) minted by the application, not an ObjectId.
 */
@Schema({ collection: MongoCollections.NOTIFICATIONS, timestamps: true, versionKey: false })
export class Notification {
  @Prop({ type: String, required: true })
  _id!: string; // ntf_*

  // Guest-checkout key. A notification may be addressed before a User exists.
  // Optional: staff/admin recipients (identity's RBAC events) have no
  // MemberProfile at all — userId carries those instead. At least one of
  // profileId/userId is required, enforced at the service layer.
  @Prop({ type: String, index: true })
  profileId?: string;

  @Prop({ type: String, index: true })
  userId?: string;

  @Prop({ type: String, required: true })
  category!: string;

  @Prop({ type: String, required: true })
  eventType!: string;

  @Prop({ type: String })
  templateKey?: string;

  @Prop({ type: String, required: true, enum: Object.values(NotificationChannel) })
  channel!: NotificationChannel;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.NORMAL,
  })
  priority!: NotificationPriority;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  subject?: string;

  @Prop({ type: String, required: true })
  body!: string;

  // Template variables (redacted — no secrets/PII beyond recipient name).
  @Prop({ type: Object })
  payload?: Record<string, unknown>;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  // Idempotency key, e.g. 'enrolment.activated:enr_123'. Unique when present so a
  // replayed domain event can never double-send. Sparse: many records have none.
  @Prop({ type: String, unique: true, sparse: true })
  dedupeKey?: string;

  @Prop({ type: String, index: true })
  correlationId?: string;

  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: String })
  error?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Dispatch scan (due, pending) and per-recipient history.
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ profileId: 1, createdAt: -1 });
