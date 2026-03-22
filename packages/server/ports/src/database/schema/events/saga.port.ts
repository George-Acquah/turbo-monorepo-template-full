import type { DatabaseTx } from '../shared';
import { SagaDefinition, SagaState } from './saga.types';

export abstract class SagaStatePort {
  abstract saveTx(tx: DatabaseTx, state: SagaState): Promise<void>;
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
