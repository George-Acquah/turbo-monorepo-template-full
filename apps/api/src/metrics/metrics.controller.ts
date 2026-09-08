import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@workspace/guards';
import { RolesGuard } from '@workspace/permissions';
import { AdminOnly } from '@workspace/decorators';
import { MetricsService } from './metrics.service';
import { MetricsOverviewResponse } from './dto/metrics-overview.response';

/**
 * Admin reporting surface — a generic example. `GET /admin/metrics/overview`
 * powers a dashboard KPI row. Platform-admin only for now (`AdminOnly` →
 * RolesGuard); scope to a finer `ops:*` permission if support/auditor roles
 * should see it later.
 */
@ApiTags('Admin — Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@Controller('admin/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPIs + daily time-series for the admin dashboard' })
  @ApiResponse({ status: 200, type: MetricsOverviewResponse })
  async overview(): Promise<MetricsOverviewResponse> {
    return this.metricsService.getOverview();
  }
}
