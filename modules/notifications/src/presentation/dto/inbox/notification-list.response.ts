import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NotificationResponse } from './notification.response';

export class NotificationListResponse {
  @ApiProperty({ description: 'Total count of notifications matching the query (ignores skip/take).' })
  @Expose()
  total!: number;

  @ApiProperty({ type: () => NotificationResponse, isArray: true })
  @Expose()
  @Type(() => NotificationResponse)
  items!: NotificationResponse[];
}
