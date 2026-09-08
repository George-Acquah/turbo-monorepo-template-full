import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Built via `plainToInstance(UserRoleResponse, assignment, { excludeExtraneousValues: true })`.
 */
export class UserRoleResponse {
  @ApiProperty({ description: 'Assignment id.', example: 'url_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'User id this role is assigned to.', example: 'usr_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  userId!: string;

  @ApiProperty({ description: 'Role id.', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  roleId!: string;

  @ApiProperty({ description: 'Denormalised role key.', example: 'platform_support' })
  @Expose()
  roleKey!: string;

  @ApiPropertyOptional({ type: String, description: 'userId of the admin who granted this assignment.', nullable: true })
  @Expose()
  grantedBy!: string | null;

  @ApiPropertyOptional({ type: Date, description: 'When this assignment expires.', nullable: true })
  @Expose()
  expiresAt!: Date | null;

  @ApiPropertyOptional({ type: Date, description: 'When this assignment was revoked, if it was.', nullable: true })
  @Expose()
  revokedAt!: Date | null;

  @ApiProperty({ description: 'When this assignment was created.' })
  @Expose()
  createdAt!: Date;
}
