import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Swagger-visible mirror of `JobLogDto` (`@workspace/ports`). Built via
 * `plainToInstance(JobLogResponse, dto, { excludeExtraneousValues: true })`.
 */
export class JobLogResponse {
  @ApiProperty({ description: 'Job log entry id.' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Name of the job.' })
  @Expose()
  jobName!: string;

  @ApiPropertyOptional({ type: String, description: 'Queue-assigned job id.', nullable: true })
  @Expose()
  jobId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Name of the queue this job ran on.', nullable: true })
  @Expose()
  queueName?: string | null;

  @ApiProperty({ description: 'Current job status.' })
  @Expose()
  status!: string;

  @ApiPropertyOptional({ type: Date, description: 'When this job started.', nullable: true })
  @Expose()
  startedAt?: Date | null;

  @ApiPropertyOptional({ type: Date, description: 'When this job completed.', nullable: true })
  @Expose()
  completedAt?: Date | null;

  @ApiPropertyOptional({ type: Number, description: 'Job duration in milliseconds.', nullable: true })
  @Expose()
  durationMs?: number | null;

  @ApiPropertyOptional({ type: Number, description: 'Attempt number for this run.', nullable: true })
  @Expose()
  attempt?: number | null;

  @ApiPropertyOptional({ type: String, description: 'Error message, if the job failed.', nullable: true })
  @Expose()
  errorMessage?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Additional structured metadata.', nullable: true })
  @Expose()
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'When this entry was created.' })
  @Expose()
  createdAt!: Date;
}
