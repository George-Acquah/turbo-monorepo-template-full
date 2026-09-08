import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { TradingExperience } from '@workspace/constants';

/**
 * Built via `plainToInstance(AccountResponse, profile, { excludeExtraneousValues: true })`.
 */
export class AccountResponse {
  @ApiProperty({ description: 'Member profile id.', example: 'prf_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ type: String, description: 'Linked auth user id, once claimed.', nullable: true })
  @Expose()
  userId!: string | null;

  @ApiProperty({ description: 'Email address.', example: 'ama@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({ description: 'First name.' })
  @Expose()
  firstName!: string;

  @ApiProperty({ description: 'Last name.' })
  @Expose()
  lastName!: string;

  @ApiPropertyOptional({ type: String, description: 'Phone number.', nullable: true })
  @Expose()
  phone!: string | null;

  @ApiPropertyOptional({ type: String, description: 'ISO country code.', nullable: true })
  @Expose()
  country!: string | null;

  @ApiPropertyOptional({
    description: 'Self-reported trading experience.',
    enum: Object.values(TradingExperience),
    nullable: true,
  })
  @Expose()
  experience!: TradingExperience | null;

  @ApiPropertyOptional({ type: String, description: 'What the member wants to achieve.', nullable: true })
  @Expose()
  goal!: string | null;

  @ApiProperty({ description: 'Whether the member opts in to marketing email.' })
  @Expose()
  marketingOptIn!: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'ISO timestamp of first-run onboarding completion (null = not yet).',
    nullable: true,
  })
  @Expose()
  @Transform(({ obj }) => {
    const value = (obj as { metadata?: Record<string, unknown> | null }).metadata?.['onboardedAt'];
    return typeof value === 'string' ? value : null;
  })
  onboardedAt!: string | null;

  @ApiProperty({ description: 'When this profile was created.' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'When this profile was last updated.' })
  @Expose()
  updatedAt!: Date;
}
