import { WorkerHost } from '@nestjs/bullmq';
import { Inject, Optional } from '@nestjs/common';
import { JobExecutionStatus, SystemRoleKey } from '@workspace/constants';
import {
  AUDIT_COMMAND_PORT,
  AuditCommandPort,
  HASH_PORT_TOKEN,
  HashPort,
  IDEMPOTENCY_KEY_REPOSITORY_TOKEN,
  IdempotencyDecision,
  IdempotencyKeyRepositoryPort,
  LOGGER_TOKEN,
  LoggerPort,
} from '@workspace/ports';
import type { IdempotencyConfig, RequestContext } from '@workspace/types';
import { nowMs } from '@workspace/utils/date';
import { AsyncLocalStorage } from 'async_hooks';
import type { Job } from 'bullmq';

export abstract class QueueProcessor<T = unknown> extends WorkerHost {
  protected readonly context: string;

  /**
   * Set this to true in system-level background processors (e.g. Outbox, Cleanups)
   * to bypass multi-tenant query filtration checks.
   */
  protected skipTenancy = false; // <-- Add this property

  @Inject(LOGGER_TOKEN)
  protected logger!: LoggerPort;

  @Inject(HASH_PORT_TOKEN)
  protected hashPort!: HashPort;

  @Optional()
  @Inject(AsyncLocalStorage)
  protected als?: AsyncLocalStorage<RequestContext>;

  @Optional()
  @Inject(IDEMPOTENCY_KEY_REPOSITORY_TOKEN)
  protected idempotency?: IdempotencyKeyRepositoryPort;

  /**
   * Generic/cross-cutting infra (this base class) has no natural import path
   * into one bounded context's module tree, so JobLog rows are written via
   * @Optional() injection against AuditPersistenceModule's @Global()
   * AUDIT_COMMAND_PORT rather than a hard dependency. Undefined (no-op) in
   * any process that never instantiates AuditPersistenceModule.
   */
  @Optional()
  @Inject(AUDIT_COMMAND_PORT)
  protected auditCommand?: AuditCommandPort;

  protected idempotencyConfig?: IdempotencyConfig;

  /**
   * If true, processing continues when idempotency infrastructure fails.
   * If false, the job fails and can be retried later.
   */
  protected failOpenOnIdempotencyError = true;

  protected constructor(context?: string) {
    super();
    this.context = context ?? this.constructor.name;
  }

  /**
   * Business logic implementation.
   */
  protected abstract handle(job: Job<T>): Promise<void>;

  /**
   * Override to enable idempotency.
   * @param _job The job to get the idempotency configuration for
   *
   * Example:
   *
   * ```typescript
   * protected override getIdempotencyConfig(job: Job<T>) {
   *   return {
   *     key: job.data.eventId,
   *     scope: job.data.tenantId,
   *     ttlSeconds: 60 * 60 * 24,
   *   };
   * }
   * ```
   */
  protected getIdempotencyConfig(_job: Job<T>): IdempotencyConfig | undefined {
    return undefined;
  }

  /**
   * DO NOT override.
   */
  async process(job: Job<T>): Promise<void> {
    const jobContext = this.createJobContext(job);

    if (this.als && !this.als.getStore() && jobContext) {
      return this.als.run(jobContext, () => this.processWithinContext(job));
    }

    return this.processWithinContext(job);
  }

  private async processWithinContext(job: Job<T>): Promise<void> {
    this.onJobStart(job);

    const startedAt = nowMs();

    this.idempotencyConfig = this.getIdempotencyConfig(job);

    const idempotencyKey = this.idempotencyConfig?.key;
    const idempotencyScope = this.idempotencyConfig?.scope ?? this.context;
    const idempotencyTtlSeconds = this.idempotencyConfig?.ttlSeconds ?? 14_000_000;

    // Computed only when something will actually read it. `requestHash` is
    // consumed solely by beginIdempotency, and that returns early without a
    // repository or a key — so for a processor with no idempotency config this
    // used to serialise the entire job payload and HMAC it for nothing, on
    // every single job.
    const requestHash =
      this.idempotencyConfig && this.idempotency && idempotencyKey
        ? await this.hashPort.hashBuffer(Buffer.from(JSON.stringify(job.data), 'utf-8'))
        : '';

    const shouldProcess = !this.idempotencyConfig
      ? true
      : await this.beginIdempotency(
          idempotencyKey,
          idempotencyScope,
          requestHash,
          idempotencyTtlSeconds,
        );

    if (!shouldProcess) {
      return;
    }

    try {
      await this.handle(job);

      await this.completeIdempotency(idempotencyKey, idempotencyScope);

      this.onJobComplete(job, Date.now() - startedAt);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.onJobFailed(job, error);

      await this.failIdempotency(idempotencyKey, idempotencyScope, error);

      throw err;
    }
  }

  private async beginIdempotency(
    key: string | undefined,
    scope: string,
    requestHash: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.idempotency || !key) {
      return true;
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      const decision = await this.idempotency.begin({
        key,
        requestHash,
        scope,
        expiresAt,
      });

      switch (decision.decision) {
        case 'EXECUTE':
          return true;

        case 'SKIP':
          this.logger.debug(`Skipping duplicate job [key=${key}]`, this.context);

          // throw new SkipJobError();
          return false;

        default:
          this.logger.warn(
            `Unknown idempotency decision "${String(
              (decision as IdempotencyDecision).decision,
            )}" for key=${key}`,
            this.context,
          );

          return true;
      }
    } catch (error) {
      // if (error instanceof SkipJobError) {
      //   throw error;
      // }

      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.error(
        `Idempotency begin failed [key=${key}]: ${err.message}`,
        err.stack,
        this.context,
      );

      if (!this.failOpenOnIdempotencyError) {
        throw err;
      }
      return true;
    }
  }

  private async completeIdempotency(key: string | undefined, scope: string): Promise<void> {
    if (!this.idempotency || !key) {
      return;
    }

    try {
      await this.idempotency.complete({
        key,
        scope,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.error(
        `Idempotency complete failed [key=${key}]: ${err.message}`,
        err.stack,
        this.context,
      );

      if (!this.failOpenOnIdempotencyError) {
        throw err;
      }
    }
  }

  private async failIdempotency(
    key: string | undefined,
    scope: string,
    error: Error,
  ): Promise<void> {
    void error;
    if (!this.idempotency || !key) {
      return;
    }

    try {
      await this.idempotency.fail({
        key,
        scope,
        // error: error.message,
      });
    } catch (idempotencyError) {
      const err =
        idempotencyError instanceof Error ? idempotencyError : new Error(String(idempotencyError));

      this.logger.error(
        `Idempotency fail failed [key=${key}]: ${err.message}`,
        err.stack,
        this.context,
      );
    }
  }

  private createJobContext(job: Job<T>): RequestContext | undefined {
    const data = job.data as Record<string, unknown> | undefined;

    if (!data) {
      return undefined;
    }

    const metadata = objectValue(data.metadata);
    const trace = objectValue(data.trace);
    const actor = objectValue(data.actor);

    const requestId =
      stringValue(trace?.requestId) ?? stringValue(metadata?.correlationId) ?? String(job.id);

    const sessionId = stringValue(trace?.sessionId);

    return {
      requestId,
      method: 'QUEUE',
      path: job.name,

      sessionId,
      actor: actor as RequestContext['actor'],
      trace: {
        requestId,
        correlationId: stringValue(trace?.correlationId) ?? requestId,
        sessionId,
      },
      user: stringValue(actor?.userId)
        ? {
            id: stringValue(actor?.userId) ?? '',
            email: '',
            role: stringValue(actor?.role) as SystemRoleKey | undefined,
          }
        : undefined,
      startTime: Date.now(),
    };
  }

  protected onJobStart(job: Job<T>): void {
    this.logger.debug(`Job started [jobId=${job.id}, name=${job.name}]`, this.context);

    this.recordJobLog({
      queueName: this.context,
      jobName: job.name,
      jobId: job.id,
      status: JobExecutionStatus.ACTIVE,
      startedAt: new Date(),
      attempt: job.attemptsMade + 1,
    });
  }

  protected onJobComplete(job: Job<T>, durationMs: number): void {
    this.logger.debug(`Job completed [jobId=${job.id}] in ${durationMs}ms`, this.context);

    this.recordJobLog({
      queueName: this.context,
      jobName: job.name,
      jobId: job.id,
      status: JobExecutionStatus.COMPLETED,
      completedAt: new Date(),
      durationMs,
      attempt: job.attemptsMade + 1,
    });
  }

  protected onJobFailed(job: Job<T>, error: Error): void {
    this.logger.error(`Job failed [jobId=${job.id}]: ${error.message}`, error.stack, this.context);

    this.recordJobLog({
      queueName: this.context,
      jobName: job.name,
      jobId: job.id,
      status: JobExecutionStatus.FAILED,
      attempt: job.attemptsMade + 1,
      errorMessage: error.message,
    });
  }

  /**
   * Fire-and-forget JobLog write. workspace_audit.job_logs is create-only (see
   * AuditPersistenceModule's doc comment) — every lifecycle callback creates
   * its own row rather than updating one created earlier, and a write failure
   * here must never affect job processing (never awaited into the main flow).
   */
  private recordJobLog(data: {
    queueName: string;
    jobName: string;
    jobId?: string;
    status: string;
    startedAt?: Date;
    completedAt?: Date;
    durationMs?: number;
    attempt?: number;
    errorMessage?: string;
  }): void {
    if (!this.auditCommand) return;

    void this.auditCommand
      .createJobLog(data)
      .catch((err: unknown) =>
        this.logger.debug(`JobLog write failed: ${String(err)}`, this.context),
      );
  }

  protected async updateProgress(job: Job<T>, progress: number | object): Promise<void> {
    await job.updateProgress(progress);
    this.onJobProgress(job, progress);
  }

  protected onJobProgress(job: Job<T>, progress: number | object): void {
    this.logger.debug(`Job progress [jobId=${job.id}]: ${JSON.stringify(progress)}`, this.context);
  }
}

// class SkipJobError extends Error {
//   constructor() {
//     super('Duplicate job skipped');
//   }
// }

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
