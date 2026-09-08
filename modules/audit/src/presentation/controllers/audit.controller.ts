import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { PermissionsGuard } from '@workspace/permissions';
import { RequirePermission } from '@workspace/decorators';
import { Action, Resource } from '@workspace/constants';
import { SearchAuditLogsUseCase } from '@/application/use-cases/search-audit-logs.use-case';
import { GetAuditLogByIdUseCase } from '@/application/use-cases/get-audit-log-by-id.use-case';
import { GetEntityAuditHistoryUseCase } from '@/application/use-cases/get-entity-audit-history.use-case';
import { SearchSystemEventsUseCase } from '@/application/use-cases/search-system-events.use-case';
import { SearchApiLogsUseCase } from '@/application/use-cases/search-api-logs.use-case';
import { SearchJobLogsUseCase } from '@/application/use-cases/search-job-logs.use-case';
import { SearchLoginAttemptsUseCase } from '@/application/use-cases/search-login-attempts.use-case';
import { SearchAuditLogsQueryDto } from '../dto/search-audit-logs-query.dto';
import { SearchSystemEventsQueryDto } from '../dto/search-system-events-query.dto';
import { SearchApiLogsQueryDto } from '../dto/search-api-logs-query.dto';
import { SearchJobLogsQueryDto } from '../dto/search-job-logs-query.dto';
import { SearchLoginAttemptsQueryDto } from '../dto/search-login-attempts-query.dto';
import { AuditLogResponse } from '../dto/responses/audit-log.response';
import { PaginatedAuditLogResponse } from '../dto/responses/paginated-audit-log.response';
import { SystemEventResponse } from '../dto/responses/system-event.response';
import { ApiLogResponse } from '../dto/responses/api-log.response';
import { JobLogResponse } from '../dto/responses/job-log.response';
import { LoginAttemptResponse } from '../dto/responses/login-attempt.response';

/**
 * Admin read surface over the append-only audit tables (doc 10 §4:
 * `GET /v1/admin/audit-logs` — `audit:read`).
 *
 * Every route requires `AUDIT:READ`, not merely a valid session. These tables
 * are the most sensitive read surface on the platform: AuditLog carries
 * actorEmail, ipAddress, userAgent and oldValues/newValues JSONB diffs of
 * money and access mutations; ApiLog carries userId + IP + UA for every
 * request ever made; and `login-attempts?identifier=<email>` is an
 * authentication-history oracle for an arbitrary address. With JwtAuthGuard
 * alone — which is how this shipped — any member account (registration is
 * open) could read all of it.
 *
 * Note for anyone reading git history: the comment previously here claimed
 * permission enforcement was "pending the broader RBAC-guard buildout … no
 * guard reads them yet — a repo-wide gap". That was stale, not accurate:
 * PermissionsGuard existed and was already applied correctly by 14 other
 * controllers. This module was the only place the gap survived.
 */
@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class AuditController {
  constructor(
    private readonly searchAuditLogs: SearchAuditLogsUseCase,
    private readonly getAuditLogById: GetAuditLogByIdUseCase,
    private readonly getEntityAuditHistory: GetEntityAuditHistoryUseCase,
    private readonly searchSystemEvents: SearchSystemEventsUseCase,
    private readonly searchApiLogs: SearchApiLogsUseCase,
    private readonly searchJobLogs: SearchJobLogsUseCase,
    private readonly searchLoginAttempts: SearchLoginAttemptsUseCase,
  ) {}

  @Get('logs')
  @RequirePermission(Action.LIST, Resource.AUDIT)
  @ApiOperation({ summary: 'Search append-only audit log entries' })
  @ApiResponse({ status: 200, type: PaginatedAuditLogResponse })
  async searchLogs(
    @Query() query: SearchAuditLogsQueryDto,
  ): Promise<{ total: number; items: AuditLogResponse[] }> {
    const result = await this.searchAuditLogs.execute(query);
    return {
      total: result.total,
      items: plainToInstance(AuditLogResponse, result.items, { excludeExtraneousValues: true }),
    };
  }

  @Get('logs/:id')
  @RequirePermission(Action.READ, Resource.AUDIT)
  @ApiOperation({ summary: 'Get a single audit log entry by id' })
  @ApiResponse({ status: 200, type: AuditLogResponse })
  async getLogById(@Param('id') id: string): Promise<AuditLogResponse> {
    const log = await this.getAuditLogById.execute(id);
    return plainToInstance(AuditLogResponse, log, { excludeExtraneousValues: true });
  }

  @Get('logs/entity/:entityType/:entityId')
  @RequirePermission(Action.READ, Resource.AUDIT)
  @ApiOperation({ summary: "Get an entity's full audit history" })
  @ApiResponse({ status: 200, type: [AuditLogResponse] })
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLogResponse[]> {
    const logs = await this.getEntityAuditHistory.execute(entityType, entityId);
    return plainToInstance(AuditLogResponse, logs, { excludeExtraneousValues: true });
  }

  @Get('system-events')
  @RequirePermission(Action.LIST, Resource.AUDIT)
  @ApiOperation({ summary: 'Search system events' })
  @ApiResponse({ status: 200, type: [SystemEventResponse] })
  async searchSystemEventsRoute(
    @Query() query: SearchSystemEventsQueryDto,
  ): Promise<SystemEventResponse[]> {
    const events = await this.searchSystemEvents.execute(query);
    return plainToInstance(SystemEventResponse, events, { excludeExtraneousValues: true });
  }

  @Get('api-logs')
  @RequirePermission(Action.LIST, Resource.AUDIT)
  @ApiOperation({ summary: 'Search API request logs' })
  @ApiResponse({ status: 200, type: [ApiLogResponse] })
  async searchApiLogsRoute(@Query() query: SearchApiLogsQueryDto): Promise<ApiLogResponse[]> {
    const logs = await this.searchApiLogs.execute(query);
    return plainToInstance(ApiLogResponse, logs, { excludeExtraneousValues: true });
  }

  @Get('job-logs')
  @RequirePermission(Action.LIST, Resource.AUDIT)
  @ApiOperation({ summary: 'Search background job logs' })
  @ApiResponse({ status: 200, type: [JobLogResponse] })
  async searchJobLogsRoute(@Query() query: SearchJobLogsQueryDto): Promise<JobLogResponse[]> {
    const logs = await this.searchJobLogs.execute(query);
    return plainToInstance(JobLogResponse, logs, { excludeExtraneousValues: true });
  }

  @Get('login-attempts')
  @RequirePermission(Action.LIST, Resource.AUDIT)
  @ApiOperation({ summary: 'Search login attempts for an identifier' })
  @ApiResponse({ status: 200, type: [LoginAttemptResponse] })
  async searchLoginAttemptsRoute(
    @Query() query: SearchLoginAttemptsQueryDto,
  ): Promise<LoginAttemptResponse[]> {
    const attempts = await this.searchLoginAttempts.execute(query);
    return plainToInstance(LoginAttemptResponse, attempts, { excludeExtraneousValues: true });
  }
}
