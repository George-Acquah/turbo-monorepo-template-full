import { Inject, Injectable } from '@nestjs/common';
import {
  ContextPort,
  TransactionPort,
  type TransactionEngine,
  CONTEXT_TOKEN,
  TRANSACTION_PORT_TOKEN,
  type RunInTransactionOptions,
} from '../interfaces/transaction.interface';
import { withAmbientTx } from './transaction.context';

/**
 * Convenience unit-of-work entry point for persistence packages. Opens a
 * transaction via the bound TransactionPort (concrete binding supplied by
 * @workspace/prisma or @workspace/mongo) and, when running inside a request
 * context, stores the tx ambiently for the duration via ContextPort so nested
 * repository calls can pick it up without every call threading `tx` by hand.
 *
 * Individual repository methods still accept an explicit optional `tx` per
 * their port signature — this is a convenience layer on top, not a
 * replacement for the explicit-tx contract.
 */
@Injectable()
export class TransactionRunner {
  constructor(
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  run<T>(
    engine: TransactionEngine,
    fn: (tx: unknown) => Promise<T>,
    options?: RunInTransactionOptions,
  ): Promise<T> {
    return this.transactionPort.execute(
      (tx) => withAmbientTx(this.context, engine, tx, () => fn(tx)),
      options,
    );
  }
}
