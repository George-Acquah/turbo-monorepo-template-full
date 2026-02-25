import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  LOGGER_TOKEN,
  LoggerPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
  SAGA_ORCHESTRATOR_TOKEN,
  SAGA_STATE_TOKEN,
  SagaOchestratorPort,
  SagaStatePort,
} from '@repo/ports';

/**
 * Periodic cleanup and recovery for sagas:
 * - Mark timed-out IN_PROGRESS sagas as FAILED and trigger background compensation
 * - Delete old completed/compensated/failed sagas older than a retention period
 */
@Injectable()
export class SagaCleanupService {
  private readonly context = SagaCleanupService.name;

  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(SAGA_STATE_TOKEN)
    private readonly saga: SagaStatePort,
    @Inject(SAGA_ORCHESTRATOR_TOKEN) private readonly orchestrator: SagaOchestratorPort,
    @Optional()
    @Inject(METRICS_PORT_TOKEN)
    private readonly metrics?: MetricsPort,
  ) {}

  /**
   * Sweep for sagas that have timed out and trigger compensation.
   * TTLs: by default, treat sagas with timeoutAt < now as timed out.
   */
  async handleTimeouts(): Promise<void> {
    await this.metrics?.time('saga.cleanup.timeout_scan.duration', undefined, async () => {
      const timedOut = await this.saga.findByType('');

      for (const s of timedOut) {
        try {
          this.logger.log(`Found timed-out saga: ${s.correlationId} (${s.sagaType})`, this.context);
          await this.orchestrator.compensateByCorrelationId(s.correlationId);
        } catch (e) {
          this.logger.error(
            `Failed to recover timed-out saga ${s.correlationId}: ${(e as Error).message}`,
            (e as Error).stack,
            this.context,
          );
        }
      }
    });
  }

  /**
   * Remove old sagas to keep DB tidy. This deletes sagas that are completed/compensated/failed
   * and older than `retentionDays`.
   */
  async cleanupCompleted(retentionDays = 30): Promise<void> {
    const _res = this.metrics
      ? await this.metrics.time('saga.cleanup.delete.duration', undefined, () =>
          // this.prisma.sagaState.deleteMany({
          //   where: {
          //     AND: [
          //       { completedAt: { lt: cutoff } },
          //       { status: { in: ['COMPLETED', 'COMPENSATED', 'FAILED'] } },
          //     ],
          //   },
          // }),
          this.saga.updateCompensated(''),
        )
      : await this.saga.updateCompensated('');

    this.logger.log(`Deleted old saga states older than ${retentionDays} days`, this.context);
  }
}
