import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Built via `plainToInstance(RoleResponse, role, { excludeExtraneousValues: true })`.
 */
export class RoleResponse {
  @ApiProperty({ description: 'Role id.', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Machine-readable role key.', example: 'platform_support' })
  @Expose()
  key!: string;

  @ApiProperty({ description: 'Human-readable role name.', example: 'Platform Support' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ type: String, description: 'Description of what this role is for.', nullable: true })
  @Expose()
  description!: string | null;

  @ApiProperty({ description: 'Whether this is a platform-seeded role (not admin-editable).' })
  @Expose()
  isSystem!: boolean;

  @ApiProperty({ description: 'Whether this role can currently be assigned.' })
  @Expose()
  isActive!: boolean;

  @ApiPropertyOptional({ type: String, description: 'userId of the admin who created this role.', nullable: true })
  @Expose()
  createdByUserId!: string | null;

  @ApiPropertyOptional({
    description: 'Free-form metadata.',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  @Expose()
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ description: 'When this role was created.' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'When this role was last updated.' })
  @Expose()
  updatedAt!: Date;
}
