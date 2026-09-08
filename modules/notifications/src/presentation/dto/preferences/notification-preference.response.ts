import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  CONFIGURABLE_NOTIFICATION_CHANNELS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
} from '@workspace/constants';

export class NotificationPreferenceEntryResponse {
  @ApiProperty({ description: 'Notification category.', enum: NOTIFICATION_CATEGORIES })
  @Expose()
  category!: string;

  @ApiProperty({ description: 'Delivery channel.', enum: CONFIGURABLE_NOTIFICATION_CHANNELS })
  @Expose()
  channel!: string;

  @ApiProperty({ description: 'Whether this category/channel is currently delivered.' })
  @Expose()
  enabled!: boolean;

  @ApiProperty({
    description:
      'True when an active communication override forces delivery. The stored preference is ignored while locked — render as always-on, not as a toggle.',
  })
  @Expose()
  locked!: boolean;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Why delivery is forced (COMPLIANCE | FINANCIAL | LEGAL | SECURITY | SYSTEM).',
  })
  @Expose()
  lockedReason!: string | null;
}

/**
 * Always the complete category × channel matrix, including cells with no stored row (an absent
 * row means enabled — see GetMyNotificationPreferencesUseCase).
 */
export class NotificationPreferencesResponse {
  @ApiProperty({ type: [NotificationPreferenceEntryResponse] })
  @Expose()
  @Type(() => NotificationPreferenceEntryResponse)
  entries!: NotificationPreferenceEntryResponse[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Display labels keyed by category, so clients do not hardcode copy.',
    example: NOTIFICATION_CATEGORY_LABELS,
  })
  @Expose()
  categoryLabels!: Record<string, string>;
}
