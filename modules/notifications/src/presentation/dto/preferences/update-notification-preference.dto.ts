import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString } from 'class-validator';
import { CONFIGURABLE_NOTIFICATION_CHANNELS, NOTIFICATION_CATEGORIES } from '@workspace/constants';

/**
 * `@IsIn` here mirrors the use-case's own assertions rather than replacing them — this rejects
 * malformed requests at the edge, the use-case keeps the rule enforceable for any non-HTTP caller.
 * EMAIL is absent from `CONFIGURABLE_NOTIFICATION_CHANNELS` on purpose; see that constant.
 */
export class UpdateNotificationPreferenceDto {
  @ApiProperty({ description: 'Notification category.', enum: NOTIFICATION_CATEGORIES })
  @IsString()
  @IsIn(NOTIFICATION_CATEGORIES)
  category!: string;

  @ApiProperty({ description: 'Delivery channel.', enum: CONFIGURABLE_NOTIFICATION_CHANNELS })
  @IsString()
  @IsIn(CONFIGURABLE_NOTIFICATION_CHANNELS as readonly string[])
  channel!: string;

  @ApiProperty({ description: 'Whether to deliver this category on this channel.' })
  @IsBoolean()
  enabled!: boolean;
}
