import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Swagger-visible mirror of `SystemEventDto` (`@workspace/ports`). Built via
 * `plainToInstance(SystemEventResponse, dto, { excludeExtraneousValues: true })`.
 */
export class SystemEventResponse {
  @ApiProperty({ description: 'System event id.' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Type of system event.' })
  @Expose()
  eventType!: string;

  @ApiProperty({ description: 'Source system/service that emitted this event.' })
  @Expose()
  source!: string;

  @ApiPropertyOptional({ type: String, description: 'Error message, if this event represents a failure.', nullable: true })
  @Expose()
  errorMessage?: string | null;

  @ApiProperty({ description: 'When this event occurred.' })
  @Expose()
  occurredAt!: Date;

  @ApiPropertyOptional({ type: Object, description: 'Additional structured metadata.', nullable: true })
  @Expose()
  metadata?: Record<string, unknown> | null;
}
