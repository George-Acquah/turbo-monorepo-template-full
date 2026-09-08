import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({
    description: 'Human-readable description shown in the admin UI.',
    example: 'Approve a requested refund (must be a different user than the requester).',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this permission is currently grantable.' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
