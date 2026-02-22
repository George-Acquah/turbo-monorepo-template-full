// Base Metadata Types - Common metadata shapes with class-validator decorators

import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  IsUrl,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

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

// ─────────────────────────────────────────────────────────────────────────────
// SEO Metadata
// ─────────────────────────────────────────────────────────────────────────────

export class SeoMetadata {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsUrl()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking Metadata (for analytics/attributions)
// ─────────────────────────────────────────────────────────────────────────────

export class TrackingMetadata {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  medium?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Metadata
// ─────────────────────────────────────────────────────────────────────────────

export class AuditMetadata {
  @IsOptional()
  @IsString()
  createdByUserId?: string;

  @IsOptional()
  @IsString()
  lastModifiedByUserId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Location Metadata
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags Metadata
// ─────────────────────────────────────────────────────────────────────────────

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
