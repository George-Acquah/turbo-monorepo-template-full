import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TradingExperience } from '@workspace/constants';

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'First name.', example: 'Ama' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name.', example: 'Owusu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional({ type: String, description: 'Phone number.', example: '+233244123456', nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ type: String, description: 'ISO country code.', example: 'GH', nullable: true })
  @IsOptional()
  @IsString()
  country?: string | null;

  @ApiPropertyOptional({
    description: 'Self-reported trading experience.',
    enum: Object.values(TradingExperience),
    nullable: true,
  })
  @IsOptional()
  @IsEnum(TradingExperience)
  experience?: TradingExperience | null;

  @ApiPropertyOptional({ type: String, description: 'What the member wants to achieve.', nullable: true })
  @IsOptional()
  @IsString()
  goal?: string | null;

  @ApiPropertyOptional({ description: 'Whether the member opts in to marketing email.' })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
