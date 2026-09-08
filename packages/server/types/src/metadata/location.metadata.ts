// ─────────────────────────────────────────────────────────────────────────────
// Location Metadata
// ─────────────────────────────────────────────────────────────────────────────

import { IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';

export class LocationMetadata {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
