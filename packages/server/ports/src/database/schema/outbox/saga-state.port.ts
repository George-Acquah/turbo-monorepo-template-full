import { DatabaseTx } from '../shared';
import {
  SagaStatePersistence,
  CreateSagaStateInput,
  UpdateSagaStateInput,
  SagaStatePersistenceQueryOptions,
} from './types';

export abstract class SagaStateRepositoryPort {
  /**
   * Initializes a new saga state machine.
   */
  abstract saveTx<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    tx: DatabaseTx,
    data: CreateSagaStateInput,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>>;

  /**
   * Saves the saga state machine.
   */
  abstract saveLifecycle(state: CreateSagaStateInput): Promise<void>;

  /**
   * Retrieves a saga by its primary ID.
   */
  abstract findById<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    sagaId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K> | null>;

  /**
   * Retrieves a saga reliably using its unique correlation ID.
   */
  abstract findByCorrelationId<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    correlationId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K> | null>;

  /**
   * Finds sagas by type.
   */
  abstract findByType<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    sagaType: string,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>[]>;

  /**
   * Updates the ongoing state, data, or completed steps of a Saga.
   */
  abstract update<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    id: string,
    data: UpdateSagaStateInput,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>>;

  /**
   * Updates the saga to a compensating state.
   */
  abstract updateCompensatingByCorrelationId<
    K extends keyof SagaStatePersistence = keyof SagaStatePersistence,
  >(
    correlationId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>>;

  /**
   * Updates the saga to a compensated state.
   */
  abstract updateCompensatedByCorrelationId<
    K extends keyof SagaStatePersistence = keyof SagaStatePersistence,
  >(
    correlationId: string,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>>;

  /**
   * Finds sagas that are still IN_PROGRESS but have surpassed their timeout threshold.
   */
  abstract findTimedOutSagas<K extends keyof SagaStatePersistence = keyof SagaStatePersistence>(
    batchSize: number,
    tx?: DatabaseTx,
    options?: SagaStatePersistenceQueryOptions<K>,
  ): Promise<Pick<SagaStatePersistence, K>[]>;

  /**
   * Deletes completed sagas.
   */
  abstract deleteCompletedSagas(batchSize: number, tx?: DatabaseTx): Promise<number>;

  /**
   * Deletes old sagas.
   */
  abstract deleteOldSagas(
    batchSize: number,
    retentionDays: number,
    tx?: DatabaseTx,
  ): Promise<number>;
}

export const SAGA_STATE_REPOSITORY_TOKEN = Symbol('SAGA_STATE_REPOSITORY_TOKEN');
export const PRISMA_SAGA_STATE_REPOSITORY_TOKEN = Symbol('PRISMA_SAGA_STATE_REPOSITORY_TOKEN');
