// ─────────────────────────────────────────────────────────────────────────────
// Audit Metadata
// ─────────────────────────────────────────────────────────────────────────────

import { IsOptional, IsString } from 'class-validator';

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
