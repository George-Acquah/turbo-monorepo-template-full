import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuditLogResponse } from './audit-log.response';

/**
 * Swagger-visible wrapper for the `{ total, items }` shape `searchAuditLogs`
 * actually returns — `AuditLogResponse` alone (used as a bare
 * `@ApiResponse({ type })` before this existed) under-described the runtime
 * shape: the generated OpenAPI schema had no `items`/`total`, only
 * `AuditLogResponse`'s own fields directly.
 */
export class PaginatedAuditLogResponse {
  @ApiProperty()
  @Expose()
  total!: number;

  @ApiProperty({ type: [AuditLogResponse] })
  @Expose()
  @Type(() => AuditLogResponse)
  items!: AuditLogResponse[];
}
