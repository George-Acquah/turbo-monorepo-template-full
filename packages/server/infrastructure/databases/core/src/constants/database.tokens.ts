// Tokens genuinely owned by database-core. Transaction tokens
// (TRANSACTION_PORT_TOKEN, PRISMA_TRANSACTION_PORT_TOKEN) and CONTEXT_TOKEN
// already live in @workspace/ports — re-exported from ./interfaces, not
// redefined here. DATABASE_HEALTH_TOKEN also lives in @workspace/ports
// (alongside the DatabaseClient/DatabaseHealthPort contract it types) —
// database-core only binds it, via DatabaseHealthService in
// database-core.module.ts.
export const TRANSACTION_RUNNER_TOKEN = Symbol('TRANSACTION_RUNNER_TOKEN');
