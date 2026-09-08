import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Returned ONLY from the create endpoint. `apiKey` is the raw, unhashed key —
 * it is never persisted in plaintext and never appears in any other
 * response; copy it now, it cannot be retrieved again.
 */
export class ApiKeyCreatedResponse {
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

  @ApiProperty({ description: 'Scopes this key is allowed to use.', type: [String] })
  @Expose()
  scopes!: string[];

  @ApiProperty({
    description: 'Raw API key — shown only this once. Store it securely; it cannot be retrieved again.',
    example: 'sWn9k3m1a0b7c6d5e4f2f8x...',
  })
  @Expose()
  apiKey!: string;
}
