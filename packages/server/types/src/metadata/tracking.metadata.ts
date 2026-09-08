// ─────────────────────────────────────────────────────────────────────────────
// Tracking Metadata (for analytics/attributions)
// ─────────────────────────────────────────────────────────────────────────────

import { IsOptional, IsString } from 'class-validator';

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
