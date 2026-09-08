// Convenience re-export: the transaction CONTRACT lives in @workspace/ports
// (TransactionPort) — there is no separate "TransactionManager" abstraction in
// this package. Persistence packages that want the ergonomic unit-of-work
// entry point should use TransactionRunner (./transaction-runner); code that
// wants the raw port contract can still import it from here for convenience.
export {
  TransactionPort,
  TRANSACTION_PORT_TOKEN,
  PRISMA_TRANSACTION_PORT_TOKEN,
  type TransactionEngine,
} from '@workspace/ports';
export * from './transaction-runner';
export * from './transaction.context';
