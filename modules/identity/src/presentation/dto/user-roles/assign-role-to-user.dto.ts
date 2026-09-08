import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { IdPrefixes } from '@workspace/constants';
import { IsPrefixedId } from '@workspace/utils';

export class AssignRoleToUserDto {
  @ApiProperty({ description: 'User id (workspace_auth.users.id) to assign the role to.', example: 'usr_2f8x9k3m1a0b7c6d5e4f' })
  @IsPrefixedId(IdPrefixes.USER)
  userId!: string;

  @ApiProperty({ description: 'Role id to assign.', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @IsPrefixedId(IdPrefixes.ROLE)
  roleId!: string;

  @ApiPropertyOptional({
    description: 'When this assignment expires (omit for a permanent assignment).',
    example: '2027-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
