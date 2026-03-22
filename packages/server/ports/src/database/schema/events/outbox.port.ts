import type { DatabaseTx } from '../shared';

export interface OutboxEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  metadata?: unknown;
  correlationId: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTERED';
  createdAt?: Date;
}

export abstract class OutboxPort {
  abstract enqueueTx(event: OutboxEvent, tx?: DatabaseTx): Promise<void>;
  abstract fetchPending(limit: number): Promise<OutboxEvent[]>;
  abstract markProcessed(id: string): Promise<void>;
  abstract markFailed(id: string, error: string, retryAt?: Date): Promise<void>;
}

export const OUTBOX_TOKEN = Symbol('OUTBOX_TOKEN');
