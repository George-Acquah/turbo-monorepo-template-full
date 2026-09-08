import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Swagger-visible mirror of `AuditLogDto` (`@workspace/ports`). Built via
 * `plainToInstance(AuditLogResponse, dto, { excludeExtraneousValues: true })`.
 */
export class AuditLogResponse {
  @ApiProperty({ description: 'Audit log entry id.' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Type of entity this entry describes.' })
  @Expose()
  entityType!: string;

  @ApiProperty({ description: 'Id of the entity this entry describes.' })
  @Expose()
  entityId!: string;

  @ApiProperty({ description: 'Action performed on the entity.' })
  @Expose()
  action!: string;

  @ApiPropertyOptional({ type: String, description: 'Id of the actor who performed the action.', nullable: true })
  @Expose()
  actorId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Email of the actor who performed the action.', nullable: true })
  @Expose()
  actorEmail?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Type of actor (e.g. user, system).', nullable: true })
  @Expose()
  actorType?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Entity state before the change.', nullable: true })
  @Expose()
  oldValues?: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: Object, description: 'Entity state after the change.', nullable: true })
  @Expose()
  newValues?: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: String, description: 'IP address of the request that caused this entry.', nullable: true })
  @Expose()
  ipAddress?: string | null;

  @ApiPropertyOptional({ type: String, description: 'User agent of the request that caused this entry.', nullable: true })
  @Expose()
  userAgent?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Id of the request that caused this entry.', nullable: true })
  @Expose()
  requestId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: "Correlation id of the business transaction that caused this entry.",
    nullable: true,
  })
  @Expose()
  correlationId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Human-readable description of the change.', nullable: true })
  @Expose()
  description?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Additional structured metadata.', nullable: true })
  @Expose()
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'When this entry occurred.' })
  @Expose()
  occurredAt!: Date;
}
