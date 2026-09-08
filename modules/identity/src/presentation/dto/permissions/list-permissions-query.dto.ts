import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { Resource } from '@workspace/constants';

export class ListPermissionsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter to permissions for a single resource.',
    enum: Object.values(Resource),
    example: Resource.REFUND,
  })
  @IsOptional()
  @IsIn(Object.values(Resource))
  resource?: string;

  @ApiPropertyOptional({
    description: 'Filter by whether the permission is currently grantable.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive?: boolean;
}
