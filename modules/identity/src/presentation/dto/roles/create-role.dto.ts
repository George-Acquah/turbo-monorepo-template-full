import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Machine-readable role key (lowercase, snake_case).',
    example: 'platform_support',
  })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'key must be lowercase snake_case' })
  key!: string;

  @ApiProperty({ description: 'Human-readable role name shown in the admin UI.', example: 'Platform Support' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ description: 'Description of what this role is for.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'System roles are seeded/managed by the platform.', default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: 'Whether this role can currently be assigned.', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Free-form metadata for this role (never used for authorization decisions).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  metadata?: Record<string, unknown>;
}
