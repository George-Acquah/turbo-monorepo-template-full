import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Built via `plainToInstance(NotificationResponse, items, { excludeExtraneousValues: true })`.
 * Mirrors `InAppNotificationPersistence` (`@workspace/ports`), minus the internal
 * `notificationId`/`profileId`/`userId`/`imageUrl`/`expiresAt`/`archivedAt`/`updatedAt` fields —
 * the caller's own id is implicit, and the rest aren't needed by the inbox UI.
 */
export class NotificationResponse {
  @ApiProperty({ description: 'In-app notification id.', example: 'ian_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Notification type key.', example: 'billing.refund.succeeded' })
  @Expose()
  type!: string;

  @ApiProperty({ description: 'Notification title.' })
  @Expose()
  title!: string;

  @ApiProperty({ description: 'Notification body.' })
  @Expose()
  body!: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Deep link the notification points to, if any.',
    nullable: true,
  })
  @Expose()
  actionUrl!: string | null;

  @ApiPropertyOptional({ type: String, description: 'Icon key/URL, if any.', nullable: true })
  @Expose()
  icon!: string | null;

  @ApiProperty({ description: 'Whether the caller has read this notification.' })
  @Expose()
  read!: boolean;

  @ApiPropertyOptional({ type: Date, description: 'When the caller read this notification.', nullable: true })
  @Expose()
  readAt!: Date | null;

  @ApiProperty({ description: 'Whether the caller has archived this notification.' })
  @Expose()
  archived!: boolean;

  @ApiPropertyOptional({
    type: Object,
    description: 'Structured context for this notification, if any.',
    nullable: true,
  })
  @Expose()
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ description: 'When this notification was created.' })
  @Expose()
  createdAt!: Date;
}
