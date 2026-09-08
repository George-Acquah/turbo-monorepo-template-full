import type { ContextPort, TransactionEngine } from '@workspace/ports';

// Thin functional helpers over ContextPort's ambient (AsyncLocalStorage-backed)
// transaction storage. Query-layer code in persistence packages uses these to
// pick up an ambient tx when the caller didn't pass one explicitly, without
// needing to be a NestJS-injectable itself.

export function getAmbientTx<T = unknown>(
  context: ContextPort | undefined,
  engine: TransactionEngine,
): T | undefined {
  if (!context?.isInContext()) return undefined;
  return context.getTransaction<T>(engine);
}

export async function withAmbientTx<T>(
  context: ContextPort | undefined,
  engine: TransactionEngine,
  tx: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  if (!context?.isInContext()) return fn();

  context.setTransaction(engine, tx);
  try {
    return await fn();
  } finally {
    context.clearTransaction(engine);
  }
}
