import type { DatabaseTx } from '../shared';

export interface SagaState {
  id: string;
  sagaType: string;
  correlationId: string;
  status: SagaStatus;
  currentStep: string;
  completedSteps: string[];
  failedStep?: string;
  data: Record<string, unknown>;
  lastError?: string;
  startedAt: Date;
  completedAt?: Date;
  timeoutAt?: Date;
}

export enum SagaStatus {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
  FAILED = 'FAILED',
}

export interface SagaContext {
  sagaId: string;
  correlationId: string;
  data: Record<string, unknown>;
}

export interface SagaStep {
  name: string;
  execute(tx: DatabaseTx, context: SagaContext): Promise<void>;
  compensate(context: SagaContext): Promise<void>;
}

export interface SagaDefinition {
  name: string;
  steps: SagaStep[];
  validate?: (data: Record<string, unknown>) => void;
  timeoutMinutes?: number;
}
