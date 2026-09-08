import { ApiProperty } from '@nestjs/swagger';
import { IdPrefixes } from '@workspace/constants';
import { IsPrefixedId } from '@workspace/utils';

export class ListApiKeysQueryDto {
  @ApiProperty({ description: 'API client to list keys for.', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @IsPrefixedId(IdPrefixes.API_CLIENT)
  apiClientId!: string;
}
