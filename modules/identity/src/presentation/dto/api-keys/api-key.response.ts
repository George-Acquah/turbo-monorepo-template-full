import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ApiKeyStatus } from '@workspace/constants';

/**
 * Built via `plainToInstance(ApiKeyResponse, apiKey, { excludeExtraneousValues: true })`.
 * `keyHash` is never `@Expose()`d here — see ApiKeyCreatedResponse for the
 * one-time plaintext key returned at creation.
 */
export class ApiKeyResponse {
  @ApiProperty({ description: 'API key id.', example: 'aky_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Owning API client id.', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  apiClientId!: string;

  @ApiProperty({ description: 'Human-readable name.', example: 'Production SSR key' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'Non-secret visible prefix, for identifying this key in the UI.', example: 'sWn9k3m1a0' })
  @Expose()
  keyPrefix!: string;

  @ApiProperty({ description: 'Key status.', enum: Object.values(ApiKeyStatus) })
  @Expose()
  status!: string;

  @ApiProperty({ description: 'Scopes this key is allowed to use.', type: [String] })
  @Expose()
  scopes!: string[];

  @ApiPropertyOptional({ type: Date, description: 'When this key expires.', nullable: true })
  @Expose()
  expiresAt!: Date | null;

  @ApiPropertyOptional({ type: Date, description: 'When this key was last used.', nullable: true })
  @Expose()
  lastUsedAt!: Date | null;

  @ApiPropertyOptional({ type: Date, description: 'When this key was revoked, if it was.', nullable: true })
  @Expose()
  revokedAt!: Date | null;

  @ApiProperty({ description: 'When this key was created.' })
  @Expose()
  createdAt!: Date;
}
