// The transaction CONTRACT already exists in @workspace/ports as
// TransactionPort (execute/withTx, dual TRANSACTION_PORT_TOKEN /
// PRISMA_TRANSACTION_PORT_TOKEN) and ContextPort (setTransaction/
// getTransaction/clearTransaction, ambient AsyncLocalStorage-backed storage
// via CONTEXT_TOKEN, implemented by @workspace/context's AsyncContextService).
// database-core does not redefine either — it re-exports them here so
// persistence packages have one import path for "transaction stuff," and adds
// only the option type its own TransactionRunner needs.
export {
  TransactionPort,
  TRANSACTION_PORT_TOKEN,
  PRISMA_TRANSACTION_PORT_TOKEN,
  type TransactionEngine,
  ContextPort,
  CONTEXT_TOKEN,
} from '@workspace/ports';

export interface RunInTransactionOptions {
  maxRetries?: number;
  isolationLevel?: unknown;
  timeout?: number;
}
