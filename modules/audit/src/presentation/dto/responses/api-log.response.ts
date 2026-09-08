import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Swagger-visible mirror of `ApiLogDto` (`@workspace/ports`). Built via
 * `plainToInstance(ApiLogResponse, dto, { excludeExtraneousValues: true })`.
 */
export class ApiLogResponse {
  @ApiProperty({ description: 'API log entry id.' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'HTTP method of the request.' })
  @Expose()
  method!: string;

  @ApiProperty({ description: 'Request path.' })
  @Expose()
  path!: string;

  @ApiProperty({ description: 'HTTP response status code.' })
  @Expose()
  statusCode!: number;

  @ApiPropertyOptional({ type: String, description: 'Id of the authenticated user, if any.', nullable: true })
  @Expose()
  userId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'IP address of the requester.', nullable: true })
  @Expose()
  ipAddress?: string | null;

  @ApiPropertyOptional({ type: String, description: 'User agent of the requester.', nullable: true })
  @Expose()
  userAgent?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Id of the request.', nullable: true })
  @Expose()
  requestId?: string | null;

  @ApiPropertyOptional({ type: Number, description: 'Request duration in milliseconds.', nullable: true })
  @Expose()
  durationMs?: number | null;

  @ApiPropertyOptional({ type: String, description: 'Error message, if the request failed.', nullable: true })
  @Expose()
  errorMessage?: string | null;

  @ApiProperty({ description: 'When this request occurred.' })
  @Expose()
  occurredAt!: Date;
}
