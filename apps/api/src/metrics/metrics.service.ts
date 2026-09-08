import { Inject, Injectable } from '@nestjs/common';
import { PrismaService, PRISMA_CLIENT_TOKEN } from '@workspace/prisma';
import type { MetricsOverviewResponse, MetricPoint } from './dto/metrics-overview.response';

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = 30;

interface DayBucketRow {
  day: Date;
  total: bigint | number;
}

/**
 * Read-only reporting aggregates for the admin dashboard — a deliberately
 * generic example. Cross-cutting reporting reads several bounded contexts'
 * read models that no single domain module owns, so it goes through the shared
 * `PrismaService` directly rather than any one context's repos. Nothing here
 * writes; nothing here is on a request hot path.
 *
 * TEMPLATE NOTE: swap these queries for your product's KPIs.
 */
@Injectable()
export class MetricsService {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async getOverview(): Promise<MetricsOverviewResponse> {
    const now = new Date();
    const start = new Date(now.getTime() - RANGE_DAYS * DAY_MS);
    const prevStart = new Date(now.getTime() - 2 * RANGE_DAYS * DAY_MS);

    const [users, newUsers, newUsersPrev, auditEvents, userRows] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: start } } }),
      this.prisma.user.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: start } } }),
      this.prisma.$queryRaw<DayBucketRow[]>`
        SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS total
        FROM workspace_auth.users
        WHERE created_at >= ${start}
        GROUP BY 1 ORDER BY 1`,
    ]);

    return {
      rangeDays: RANGE_DAYS,
      users,
      usersDelta: pctDelta(newUsers, newUsersPrev),
      auditEvents,
      usersSeries: fillDays(userRows, start),
    };
  }
}

/** Signed percent change; 0→positive reads as +100%, 0→0 as 0. */
function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Turns sparse day buckets into a dense RANGE_DAYS series ending today (UTC),
 * zero-filling gaps.
 */
function fillDays(rows: DayBucketRow[], start: Date): MetricPoint[] {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    byDay.set(isoDay(new Date(row.day)), Number(row.total));
  }
  const out: MetricPoint[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  for (let i = 0; i < RANGE_DAYS; i += 1) {
    const key = isoDay(cursor);
    out.push({ date: key, value: byDay.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
