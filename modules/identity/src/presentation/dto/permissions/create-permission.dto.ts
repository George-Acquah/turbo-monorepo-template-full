import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Action, Resource } from '@workspace/constants';

export class CreatePermissionDto {
  // Hidden from the OpenAPI schema — the client cannot see or send this
  // field. Always derived as `<resource>:<action>` (lowercased — `Resource`/
  // `Action` constants are UPPERCASE, but the key format is lowercase),
  // never from a client-supplied value. A missing `resource`/`action` yields
  // `undefined` here too, which then fails `@IsString()` below alongside
  // their own required-ness failures.
  @ApiHideProperty()
  @Transform(({ obj }: { obj: { resource?: string; action?: string } }) =>
    obj.resource && obj.action
      ? `${String(obj.resource).toLowerCase()}:${String(obj.action).toLowerCase()}`
      : undefined,
  )
  @IsString()
  @Matches(/^[a-z_]+:[a-z_]+$/, { message: 'key must be in the form "<resource>:<action>" (lowercase)' })
  key!: string;

  @ApiProperty({
    description: 'The resource this permission governs.',
    enum: Object.values(Resource),
    example: Resource.REFUND,
  })
  @IsIn(Object.values(Resource))
  resource!: string;

  @ApiProperty({
    description: 'The action this permission grants on the resource.',
    enum: Object.values(Action),
    example: Action.APPROVE,
  })
  @IsIn(Object.values(Action))
  action!: string;

  @ApiPropertyOptional({
    description: 'Human-readable description shown in the admin UI.',
    example: 'Approve a requested refund (must be a different user than the requester).',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'System permissions are seeded/managed by the platform, not editable by admins.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: 'Whether this permission is currently grantable.', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
