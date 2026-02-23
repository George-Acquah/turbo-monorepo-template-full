// ports/saga/saga-state.port.ts

import { SagaDefinition, SagaState } from './saga.types';

export abstract class SagaStatePort {
  /**
   * Persist saga state inside an existing transaction.
   * Used during saga execution.
   */
  abstract saveTx(tx: unknown, state: SagaState): Promise<void>;

  /**
   * Persist saga state outside any saga transaction.
   * Used for compensation, recovery, and background workers.
   *
   * Must ALWAYS commit.
   */
  abstract saveLifecycle(state: SagaState): Promise<void>;

  abstract findByCorrelationId(correlationId: string): Promise<SagaState | null>;
  abstract updateCompensating(correlationId: string): Promise<void>;
  abstract updateCompensated(correlationId: string): Promise<void>;

  abstract findByType(sagaType: string): Promise<SagaState[]>;
}

export abstract class SagaOchestratorPort {
  abstract execute(
    definition: SagaDefinition,
    correlationId: string,
    data: Record<string, unknown>,
  ): Promise<SagaState>;

  abstract compensateByCorrelationId(correlationId: string): Promise<void>;

  abstract registerSagaDefinition(definition: SagaDefinition): void;
}

export const SAGA_ORCHESTRATOR_TOKEN = Symbol('SAGA_ORCHESTRATOR_TOKEN');

export const SAGA_STATE_TOKEN = Symbol('SAGA_STATE_TOKEN');
