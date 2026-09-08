import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Returned ONLY from the create endpoint. `clientSecret` is the raw,
 * unhashed secret — it is never persisted in plaintext and never appears in
 * any other response; copy it now, it cannot be retrieved again.
 */
export class ApiClientCreatedResponse {
  @ApiProperty({ description: 'API client id.', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Public client identifier (sent with requests).', example: 'acl_9k3m1a0b7c6d5e4f2f8x' })
  @Expose()
  clientId!: string;

  @ApiProperty({
    description: 'Raw client secret — shown only this once. Store it securely; it cannot be retrieved again.',
    example: 'sWn9k3m1a0b7c6d5e4f2f8x...',
  })
  @Expose()
  clientSecret!: string;

  @ApiProperty({ description: 'Human-readable name.', example: 'Members SSR service' })
  @Expose()
  name!: string;
}
