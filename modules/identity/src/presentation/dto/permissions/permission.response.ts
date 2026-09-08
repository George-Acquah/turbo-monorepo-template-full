import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Action, Resource } from '@workspace/constants';

/**
 * Built via `plainToInstance(PermissionResponse, permission, {
 * excludeExtraneousValues: true })` — only `@Expose()`d fields ever leave
 * this module, regardless of what the use-case/persistence layer returns.
 */
export class PermissionResponse {
  @ApiProperty({ description: 'Permission id.', example: 'pmt_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Machine-readable permission key.', example: 'refund:approve' })
  @Expose()
  key!: string;

  @ApiProperty({ description: 'The resource this permission governs.', enum: Object.values(Resource) })
  @Expose()
  resource!: string;

  @ApiProperty({ description: 'The action this permission grants.', enum: Object.values(Action) })
  @Expose()
  action!: string;

  @ApiPropertyOptional({ type: String, description: 'Human-readable description.', nullable: true })
  @Expose()
  description!: string | null;

  @ApiProperty({ description: 'Whether this is a platform-seeded permission (not admin-editable).' })
  @Expose()
  isSystem!: boolean;

  @ApiProperty({ description: 'Whether this permission is currently grantable.' })
  @Expose()
  isActive!: boolean;

  @ApiProperty({ description: 'When this permission was created.' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'When this permission was last updated.' })
  @Expose()
  updatedAt!: Date;
}
