import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsOptional, IsString, MaxLength } from 'class-validator';
import { IdPrefixes } from '@workspace/constants';
import { IsPrefixedId } from '@workspace/utils';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API client this key belongs to.', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @IsPrefixedId(IdPrefixes.API_CLIENT)
  apiClientId!: string;

  @ApiProperty({ description: 'Human-readable name for this key.', example: 'Production SSR key' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    description: 'Scopes this key is allowed to use, e.g. read-only catalog access.',
    example: ['catalog:read'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({
    description: 'When this key expires (omit for a key that never expires).',
    example: '2027-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
