import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Currency, ThemePreference } from '@workspace/constants';

/**
 * Every field optional — this is a partial update, so a client changing one setting doesn't have
 * to echo the others back (and can't accidentally clobber them by omitting one).
 */
export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    description: 'UI theme. SYSTEM follows the device setting.',
    enum: Object.values(ThemePreference),
  })
  @IsOptional()
  @IsEnum(ThemePreference)
  theme?: ThemePreference;

  @ApiPropertyOptional({ description: 'BCP-47 language tag.', example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(35) // BCP-47 permits long tags; 35 is generous and bounds the column.
  language?: string;

  @ApiPropertyOptional({ description: 'IANA timezone.', example: 'UTC' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ description: 'Preferred display currency (ISO-4217).', enum: Object.values(Currency) })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
