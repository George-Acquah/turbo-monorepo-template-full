export type IdempotencyDecision =
  | { decision: 'EXECUTE' }
  | { decision: 'SKIP'; responseData?: unknown; statusCode?: number };

export abstract class IdempotencyPort {
  abstract begin(input: {
    key: string;
    scope: string;
    requestHash?: string;
    ttlSeconds: number;
    tx?: unknown;
  }): Promise<IdempotencyDecision>;

  abstract complete(input: {
    key: string;
    scope: string;
    responseData?: unknown;
    statusCode?: number;
    tx?: unknown;
  }): Promise<void>;

  abstract fail(input: { key: string; scope: string; error: string; tx?: unknown }): Promise<void>;
}
export const IDEMPOTENCY_TOKEN = Symbol('IDEMPOTENCY_TOKEN');
