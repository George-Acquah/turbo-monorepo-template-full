import { ApiProperty } from '@nestjs/swagger';
import { IdPrefixes } from '@workspace/constants';
import { IsPrefixedId } from '@workspace/utils';

export class AssignPermissionToRoleDto {
  @ApiProperty({ description: 'Permission id to grant to this role.', example: 'pmt_2f8x9k3m1a0b7c6d5e4f' })
  @IsPrefixedId(IdPrefixes.PERMISSION)
  permissionId!: string;
}
