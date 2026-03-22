import type { DatabaseTx } from '../shared';

export type IdempotencyDecision =
  | { decision: 'EXECUTE' }
  | { decision: 'SKIP'; responseData?: unknown; statusCode?: number };

export abstract class IdempotencyPort {
  abstract begin(input: {
    key: string;
    scope: string;
    requestHash?: string;
    ttlSeconds: number;
    tx?: DatabaseTx;
  }): Promise<IdempotencyDecision>;

  abstract complete(input: {
    key: string;
    scope: string;
    responseData?: unknown;
    statusCode?: number;
    tx?: DatabaseTx;
  }): Promise<void>;

  abstract fail(input: {
    key: string;
    scope: string;
    error: string;
    tx?: DatabaseTx;
  }): Promise<void>;
}

export const IDEMPOTENCY_TOKEN = Symbol('IDEMPOTENCY_TOKEN');
