/* eslint-disable no-empty */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { IdPrefixes } from '@repo/constants';
import {
  LOGGER_TOKEN,
  LoggerPort,
  METRICS_PORT_TOKEN,
  MetricsPort,
  SAGA_STATE_TOKEN,
  SagaStatePort,
  TRANSACTION_PORT_TOKEN,
  TransactionPort,
  SagaContext,
  SagaDefinition,
  SagaOchestratorPort,
  SagaStep,
  SagaState,
  SagaStatus,
} from '@repo/ports';
import { generateId } from '@repo/utils';

@Injectable()
/**
 * Saga Orchestrator
 * Coordinates distributed transactions across multiple services
 */
export class SagaOrchestrator implements SagaOchestratorPort {
  private readonly context = SagaOrchestrator.name;

  // Registry of saga definitions so that long-running / timed-out sagas can
  // be recovered and compensated outside the original process.
  private readonly registry = new Map<string, SagaDefinition>();

  constructor(
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,

    @Inject(TRANSACTION_PORT_TOKEN)
    private readonly transaction: TransactionPort,

    @Inject(SAGA_STATE_TOKEN)
    private readonly saga: SagaStatePort,

    @Optional()
    @Inject(METRICS_PORT_TOKEN)
    private readonly metrics?: MetricsPort,
  ) {
    this.metrics = metrics;
  }

  /**
   * Execute a saga with compensation on failure
   */
  async execute(
    definition: SagaDefinition,
    correlationId: string,
    data: Record<string, unknown>,
  ): Promise<SagaState> {
    return this.metrics
      ? this.metrics.time('saga.execution.duration', { saga: definition.name }, () =>
          this.executeInternal(definition, correlationId, data),
        )
      : this.executeInternal(definition, correlationId, data);
  }

  /**
   * Register a saga definition so it can be recovered by background workers
   */
  registerSagaDefinition(definition: SagaDefinition): void {
    this.registry.set(definition.name, definition);
  }

  /**
   * Compensate a saga by its correlationId using the registered definition.
   * This allows background jobs to recover and compensate timed-out sagas.
   */
  async compensateByCorrelationId(correlationId: string): Promise<void> {
    const saga = await this.saga.findByCorrelationId(correlationId);
    if (!saga) {
      this.logger.warn(`No saga found for correlationId=${correlationId}`, this.context);
      return;
    }

    const definition = this.registry.get(saga.sagaType);
    if (!definition) {
      this.logger.error(`No registered saga definition for type ${saga.sagaType}`, this.context);
      return;
    }

    // Build executed steps list from persisted completedSteps
    const executedSteps = definition.steps.filter((s) => saga.completedSteps.includes(s.name));

    // Reverse and call compensators
    this.logger.log(
      `Compensating saga from background [correlationId=${correlationId}]`,
      this.context,
    );

    // mark compensating state
    await this.saga.updateCompensating(correlationId);

    await this.metrics?.time('saga.compensation.duration', { saga: saga.sagaType }, async () => {
      for (let i = executedSteps.length - 1; i >= 0; i--) {
        const step = executedSteps[i];
        if (!step) continue;

        this.logger.debug(
          `Background compensating step: ${step.name} [correlationId=${correlationId}]`,
          this.context,
        );
        try {
          await step.compensate({
            sagaId: saga.id,
            correlationId: saga.correlationId,
            data: saga.data as Record<string, unknown>,
          });
        } catch (e) {
          this.logger.error(
            `Background compensation error for ${step.name}: ${(e as Error).message}`,
            (e as Error).stack,
            this.context,
          );
        }
      }
    });

    await this.saga.updateCompensated(correlationId);
  }

  /**
   * Run compensation for failed saga
   */
  private async compensate(
    sagaId: string,
    executedSteps: SagaStep[],
    state: SagaState,
  ): Promise<void> {
    this.logger.log(`Starting compensation for saga [sagaId=${sagaId}]`, this.context);

    state.status = SagaStatus.COMPENSATING;
    await this.saga.saveLifecycle(state);

    try {
      this.metrics?.increment?.('sagas.compensating');
    } catch {}

    await this.metrics?.time('saga.compensation.duration', { saga: state.sagaType }, async () => {
      // Compensate in reverse order
      for (let i = executedSteps.length - 1; i >= 0; i--) {
        const step = executedSteps[i];
        if (!step) continue;

        this.logger.debug(`Compensating step: ${step.name} [sagaId=${sagaId}]`, this.context);

        try {
          await step.compensate({
            sagaId,
            correlationId: state.correlationId,
            data: state.data as Record<string, unknown>,
          });
        } catch (compensationError) {
          const message =
            compensationError instanceof Error
              ? compensationError.message
              : 'Unknown compensation error';

          this.logger.error(
            `Compensation failed for step ${step.name}: ${message}`,
            compensationError instanceof Error ? compensationError.stack : undefined,
            this.context,
          );

          // Continue compensating other steps despite failure
        }
      }
    });

    state.status = SagaStatus.COMPENSATED;
    state.completedAt = new Date();
    await this.saga.saveLifecycle(state);

    this.logger.log(`Saga compensation completed [sagaId=${sagaId}]`, this.context);

    // Metrics hook
    try {
      this.metrics?.increment?.('sagas.compensated');
    } catch {}
  }

  private async executeInternal(
    definition: SagaDefinition,
    correlationId: string,
    data: Record<string, unknown>,
  ): Promise<SagaState> {
    // Register definition for recovery/compensation later
    this.registerSagaDefinition(definition);

    // Apply optional validation early
    try {
      definition.validate?.(data);
    } catch (validationError) {
      this.logger.error(
        `Saga validation failed: ${(validationError as Error).message}`,
        (validationError as Error).stack,
        this.context,
      );
      try {
        this.metrics?.increment?.('sagas.validation_failed');
      } catch {}
      throw validationError;
    }
    const sagaId = generateId(IdPrefixes.SAGA);
    const executedSteps: SagaStep[] = [];

    const context: SagaContext = {
      sagaId,
      correlationId,
      data,
    };

    try {
      const result = await this.transaction.execute<SagaState>(async (tx) => {
        // Initialize saga state
        const state: SagaState = {
          id: sagaId,
          sagaType: definition.name,
          correlationId,
          status: SagaStatus.STARTED,
          currentStep: definition.steps[0]?.name || 'init',
          completedSteps: [],
          data,
          startedAt: new Date(),
          timeoutAt: definition.timeoutMinutes
            ? new Date(Date.now() + definition.timeoutMinutes * 60000)
            : undefined,
        };

        try {
          // Persist initial state
          await this.saga.saveTx(tx, state);
          this.logger.log(
            `Starting saga ${definition.name} [sagaId=${sagaId}, correlationId=${correlationId}]`,
            this.context,
          );

          // Metrics hook
          try {
            this.metrics?.increment?.('sagas.started');
          } catch {}
          state.status = SagaStatus.IN_PROGRESS;
          await this.saga.saveTx(tx, state);

          // Execute each step
          for (const step of definition.steps) {
            state.currentStep = step.name;

            // Check for timeout before executing the next step
            if (state.timeoutAt && state.timeoutAt.getTime() < Date.now()) {
              const message = `Saga timed out at step ${step.name}`;
              this.logger.warn(message, this.context);

              state.status = SagaStatus.FAILED;
              state.lastError = message;
              await this.saga.saveTx(tx, state);

              // Compensate what we've done so far
              await this.compensate(sagaId, executedSteps, state);
              // Increment timeout metric
              try {
                this.metrics?.increment?.('sagas.timed_out');
              } catch {}
              return state;
            }

            this.logger.log(`Starting saga step: ${step.name} [sagaId=${sagaId}]`, this.context);

            // Metrics hook per-step start
            try {
              this.metrics?.increment?.('sagas.step.started');
            } catch {}

            // Re-validate saga data before executing the step
            try {
              definition.validate?.(state.data);
            } catch (validationError) {
              const msg = `Saga validation failed before step ${step.name}: ${(validationError as Error).message}`;
              this.logger.error(msg, (validationError as Error).stack, this.context);

              state.status = SagaStatus.FAILED;
              state.lastError = msg;
              await this.saga.saveTx(tx, state);

              try {
                this.metrics?.increment?.('sagas.validation_failed');
              } catch {}

              // Compensate what we've done so far
              await this.compensate(sagaId, executedSteps, state);
              return state;
            }

            await this.metrics?.time(
              'saga.step.execution.duration',
              { saga: definition.name, step: step.name },
              () => step.execute(tx, context),
            );

            executedSteps.push(step);
            state.completedSteps.push(step.name);

            await this.saga.saveTx(tx, state);

            // Metrics hook per-step
            try {
              this.metrics?.increment?.('sagas.step.completed');
            } catch {}

            this.logger.log(`Completed saga step: ${step.name} [sagaId=${sagaId}]`, this.context);
          }

          // All steps completed successfully
          state.status = SagaStatus.COMPLETED;
          state.completedAt = new Date();
          await this.saga.saveTx(tx, state);

          try {
            this.metrics?.increment?.('sagas.completed');
          } catch {}

          this.logger.log(`Saga completed successfully [sagaId=${sagaId}]`, this.context);

          return state;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          this.logger.error(
            `Saga step failed: ${errorMessage} [sagaId=${sagaId}]`,
            error instanceof Error ? error.stack : undefined,
            this.context,
          );

          state.status = SagaStatus.FAILED;
          state.failedStep = state.currentStep;
          state.lastError = errorMessage;
          await this.saga.saveTx(tx, state);

          try {
            this.metrics?.increment?.('sagas.failed');
          } catch {}

          // Compensate executed steps in reverse order
          await this.compensate(sagaId, executedSteps, state);

          return state;
        }
      });

      if (!result) {
        throw new Error('Saga execution returned no state');
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown saga error';

      this.logger.error(message, undefined, this.context);
      try {
        this.metrics?.increment?.('sagas.failed');
      } catch {}

      const fallbackState: SagaState = {
        id: sagaId,
        sagaType: definition.name,
        correlationId,
        status: SagaStatus.FAILED,
        currentStep: executedSteps.at(-1)?.name ?? 'unknown',
        completedSteps: executedSteps.map((s) => s.name),
        failedStep: executedSteps.at(-1)?.name,
        data,
        lastError: message,
        startedAt: new Date(),
      };

      await this.compensate(sagaId, executedSteps, fallbackState);

      return fallbackState;
    }
  }
}
