import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/** Shared shape for the two count-only inbox responses (unread-count, mark-all-read). */
export class NotificationCountResponse {
  @ApiProperty({ description: 'Count of matching notifications.' })
  @Expose()
  count!: number;
}
