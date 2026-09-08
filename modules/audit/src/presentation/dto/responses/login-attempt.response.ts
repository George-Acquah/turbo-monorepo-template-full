import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Swagger-visible mirror of `LoginAttemptDto` (`@workspace/ports`). Built via
 * `plainToInstance(LoginAttemptResponse, dto, { excludeExtraneousValues: true })`.
 */
export class LoginAttemptResponse {
  @ApiProperty({ description: 'Login attempt id.' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Identifier used for the attempt (e.g. email).' })
  @Expose()
  identifier!: string;

  @ApiPropertyOptional({ type: String, description: 'Id of the matched user, if any.', nullable: true })
  @Expose()
  userId?: string | null;

  @ApiProperty({ description: 'Whether the attempt succeeded.' })
  @Expose()
  isSuccessful!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Reason for failure, if the attempt failed.', nullable: true })
  @Expose()
  failureReason?: string | null;

  @ApiPropertyOptional({ type: String, description: 'IP address of the attempt.', nullable: true })
  @Expose()
  ipAddress?: string | null;

  @ApiPropertyOptional({ type: String, description: 'User agent of the attempt.', nullable: true })
  @Expose()
  userAgent?: string | null;

  @ApiProperty({ description: 'When this attempt occurred.' })
  @Expose()
  attemptedAt!: Date;
}
