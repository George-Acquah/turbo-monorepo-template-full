// Base Metadata Types - Common metadata shapes with class-validator decorators

import { IsOptional, IsString, IsArray, IsObject, MaxLength } from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// Base Metadata Class (all metadata types extend this)
// ─────────────────────────────────────────────────────────────────────────────

export class BaseMetadata {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
