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

  /**
   * Execute step logic.
   * Must be idempotent.
   * Runs inside the saga transaction.
   */
  execute(tx: unknown, context: SagaContext): Promise<void>;

  /**
   * Compensation logic.
   * Runs OUTSIDE any transaction.
   * Must be idempotent and side-effect tolerant.
   */
  compensate(context: SagaContext): Promise<void>;
}

export interface SagaDefinition {
  name: string;
  steps: SagaStep[];
  /** Optional runtime validator for `data` - should throw on invalid input */
  validate?: (data: Record<string, unknown>) => void;
  /** Optional human-friendly default timeout (minutes) applied to created SagaState */
  timeoutMinutes?: number;
}
