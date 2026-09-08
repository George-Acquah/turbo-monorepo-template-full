import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { GetMyActivityUseCase } from '@/application/use-cases/get-my-activity.use-case';
import { SearchAuditLogsQueryDto } from '../dto/search-audit-logs-query.dto';
import { AuditLogResponse } from '../dto/responses/audit-log.response';
import { PaginatedAuditLogResponse } from '../dto/responses/paginated-audit-log.response';

/**
 * Self-service only — JwtAuthGuard, no PermissionsGuard. A member has no
 * identity role/permission for this: they can only ever see their own
 * actions, never anyone else's and never system-level data, so gating this
 * behind an identity permission would be self-defeating (mirrors
 * `modules/memberships`' `AccessController.me()`).
 *
 * A separate controller from `AuditController` on purpose: `AuditController`
 * is `PermissionsGuard`-gated at the class level, and adding one
 * `JwtAuthGuard`-only route into that same class would need an awkward
 * per-route guard override.
 */
@ApiTags('Audit — My Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('my-activity')
export class MyActivityController {
  constructor(
    private readonly getMyActivity: GetMyActivityUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's own audit trail" })
  @ApiResponse({ status: 200, type: PaginatedAuditLogResponse })
  async me(
    @Query() query: SearchAuditLogsQueryDto,
  ): Promise<{ total: number; items: AuditLogResponse[] }> {
    // Explicitly drop any caller-supplied actorId rather than relying on
    // structural typing alone — the use-case's Omit<..., 'actorId'> already
    // makes this safe, but this keeps the scoping intent readable here too.
    const { actorId: _ignoredActorId, ...safeCriteria } = query;
    const result = await this.getMyActivity.execute(this.context.getUserId(), safeCriteria);
    return {
      total: result.total,
      items: plainToInstance(AuditLogResponse, result.items, { excludeExtraneousValues: true }),
    };
  }
}
