import { ApiProperty } from '@nestjs/swagger';

/** One point in a daily time-series. `date` is `YYYY-MM-DD` (UTC day buckets). */
export class MetricPoint {
  @ApiProperty({ example: '2026-07-24' })
  date!: string;

  @ApiProperty({ example: 12, description: 'Count for the day.' })
  value!: number;
}

/** A status → count pair. */
export class StatusCount {
  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 312 })
  count!: number;
}

/**
 * Admin overview metrics — a deliberately generic example surface. KPIs carry a
 * signed period-over-period delta (percent, vs the preceding equal-length
 * window); series are daily over the trailing `rangeDays`.
 *
 * TEMPLATE NOTE: replace these fields with the aggregates your product needs.
 * `MetricsService` reads the shared `PrismaService` directly on purpose —
 * cross-cutting reporting is not a single bounded context's concern.
 */
export class MetricsOverviewResponse {
  @ApiProperty({ example: 30 })
  rangeDays!: number;

  @ApiProperty({ description: 'Total users.', example: 1204 })
  users!: number;

  @ApiProperty({ description: 'New-user momentum vs previous period, percent.', example: 8.1 })
  usersDelta!: number;

  @ApiProperty({ description: 'Audit-log rows written over the range.', example: 5210 })
  auditEvents!: number;

  @ApiProperty({ type: [MetricPoint], description: 'Daily new users.' })
  usersSeries!: MetricPoint[];
}
