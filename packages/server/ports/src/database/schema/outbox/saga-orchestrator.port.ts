import { SagaDefinition, SagaStatePersistence, SagaStatePersistenceQueryOptions } from './types';

export abstract class SagaOchestratorPort {
  /**
   * Executes a saga with the given definition and correlation ID.
   */
  abstract execute<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    definition: SagaDefinition,
    correlationId: string,
    data: Record<string, unknown>,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>>;

  /**
   * Compensates a saga by its correlation ID.
   */
  abstract compensateByCorrelationId(correlationId: string): Promise<void>;

  /**
   * Registers a saga definition.
   */
  abstract registerSagaDefinition(definition: SagaDefinition): void;
}

export const SAGA_ORCHESTRATOR_TOKEN = Symbol('SAGA_ORCHESTRATOR_TOKEN');
