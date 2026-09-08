import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Currency, ThemePreference } from '@workspace/constants';

export class PreferencesResponse {
  @ApiProperty({
    description: 'UI theme. SYSTEM follows the device setting.',
    enum: Object.values(ThemePreference),
  })
  @Expose()
  theme!: ThemePreference;

  @ApiProperty({ description: 'BCP-47 language tag.', example: 'en' })
  @Expose()
  language!: string;

  @ApiProperty({ description: 'IANA timezone.', example: 'UTC' })
  @Expose()
  timezone!: string;

  @ApiProperty({ description: 'Preferred display currency (ISO-4217).', enum: Object.values(Currency) })
  @Expose()
  currency!: Currency;
}
