export abstract class TransactionPort {
  abstract execute<T>(
    operation: (tx: unknown) => Promise<T>,
    options?: {
      maxRetries?: number;
      isolationLevel?: unknown;
      timeout?: number;
    },
  ): Promise<T>;
  abstract withTx<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}

export const TRANSACTION_PORT_TOKEN = Symbol('TRANSACTION_PORT_TOKEN');
