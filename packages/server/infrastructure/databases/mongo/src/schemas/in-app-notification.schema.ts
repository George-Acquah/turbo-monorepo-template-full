import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MongoCollections } from '../client/mongo.tokens';

export type InAppNotificationDocument = HydratedDocument<InAppNotification>;

/**
 * IN-APP FEED item (read receipts, archive).
 *
 * Aligns with InAppNotificationPersistence in the notification ports. Post-v1
 * surface (no members-app feed yet) but the schema ships ready so enabling it is
 * additive. Usually keyed on profileId — not userId — so guest-checkout
 * notifications work before an auth account exists, matching the Notification
 * record above. Staff/admin recipients (identity's RBAC events) have no
 * MemberProfile at all, so profileId is optional and userId carries the
 * record instead — at least one of the two is required, enforced by
 * NotificationDispatchService, not this schema. `_id` holds ian_*.
 */
@Schema({
  collection: MongoCollections.IN_APP_NOTIFICATIONS,
  timestamps: true,
  versionKey: false,
})
export class InAppNotification {
  @Prop({ type: String, required: true })
  _id!: string; // ian_*

  @Prop({ type: String, required: true, index: true })
  notificationId!: string;

  @Prop({ type: String, index: true })
  profileId?: string;

  @Prop({ type: String, index: true })
  userId?: string;

  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  body!: string;

  @Prop({ type: String })
  actionUrl?: string;

  @Prop({ type: String })
  icon?: string;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: Boolean, required: true, default: false })
  read!: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Boolean, required: true, default: false })
  archived!: boolean;

  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const InAppNotificationSchema = SchemaFactory.createForClass(InAppNotification);

// Unread-feed query: newest unread first for a profile, or for a user.
InAppNotificationSchema.index({ profileId: 1, read: 1, createdAt: -1 });
InAppNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
