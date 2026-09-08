// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags Metadata
// ─────────────────────────────────────────────────────────────────────────────

import { IsOptional, IsBoolean, IsArray, IsString } from 'class-validator';

export class FeatureFlags {
  @IsOptional()
  @IsBoolean()
  isExperimental?: boolean;

  @IsOptional()
  @IsBoolean()
  isBeta?: boolean;

  @IsOptional()
  @IsBoolean()
  isPromoted?: boolean;

  @IsOptional()
  @IsBoolean()
  isHighlighted?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledFeatures?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabledFeatures?: string[];
}
