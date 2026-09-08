import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ApiClientStatus } from '@workspace/constants';

/**
 * Built via `plainToInstance(ApiClientResponse, apiClient, { excludeExtraneousValues: true })`.
 * `clientSecretHash` is never `@Expose()`d here — see ApiClientCreatedResponse
 * for the one-time plaintext secret returned at creation.
 */
export class ApiClientResponse {
  @ApiProperty({ description: 'API client id.', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Human-readable name.', example: 'Members SSR service' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ type: String, description: 'What this client is used for.', nullable: true })
  @Expose()
  description!: string | null;

  @ApiProperty({ description: 'Public client identifier (sent with requests).', example: 'acl_9k3m1a0b7c6d5e4f2f8x' })
  @Expose()
  clientId!: string;

  @ApiProperty({ description: 'Client status.', enum: Object.values(ApiClientStatus) })
  @Expose()
  status!: string;

  @ApiPropertyOptional({ type: String, description: 'userId of the admin who created this client.', nullable: true })
  @Expose()
  createdByUserId!: string | null;

  @ApiPropertyOptional({ type: Date, description: 'When this client last authenticated.', nullable: true })
  @Expose()
  lastUsedAt!: Date | null;

  @ApiPropertyOptional({
    description: 'Free-form metadata.',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  @Expose()
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ description: 'When this client was created.' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'When this client was last updated.' })
  @Expose()
  updatedAt!: Date;
}
