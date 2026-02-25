// packages/database/src/prisma-transaction.adapter.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma as PrismaNs } from '../generated/prisma/client';
import { LOGGER_TOKEN, LoggerPort, CONTEXT_TOKEN, ContextPort, TransactionPort } from '@repo/ports';
import { PrismaService } from './prisma.service';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class PrismaTransactionAdapter implements TransactionPort {
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_TIMEOUT = 10_000;
  private readonly DEFAULT_ISOLATION = PrismaNs.TransactionIsolationLevel.Serializable;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
  ) {}

  async withTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    // Reuse active tx if we’re already inside a transaction
    const existing = this.safeGetTx();
    if (existing) return fn(existing);

    return this.execute(fn);
  }

  async execute<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxRetries?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
      timeout?: number;
    },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.DEFAULT_MAX_RETRIES;
    const isolationLevel = options?.isolationLevel ?? this.DEFAULT_ISOLATION;
    const timeout = options?.timeout ?? this.DEFAULT_TIMEOUT;

    // If there’s already a tx in context, don’t nest (Prisma doesn’t do true nested tx)
    const existing = this.safeGetTx();
    if (existing) return operation(existing);

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      try {
        return await this.prisma.db.$transaction<T>(
          async (tx) => {
            const hadContext = this.ctx.isInContext();
            const previous = hadContext ? this.safeGetTx() : undefined;

            if (hadContext) {
              this.ctx.setTransaction('prisma', tx as unknown as Prisma.TransactionClient);
            }

            try {
              return await operation(tx as unknown as Prisma.TransactionClient);
            } finally {
              if (hadContext) {
                if (previous) {
                  this.ctx.setTransaction('prisma', previous);
                } else {
                  this.ctx.clearTransaction('prisma');
                }
              }
            }
          },
          { isolationLevel, timeout },
        );
      } catch (err) {
        lastError = err;
        attempt++;

        if (!this.isRetryable(err) || attempt >= maxRetries) throw err;

        this.logger.warn(
          `[tx] retryable conflict (${attempt}/${maxRetries}) isolation=${isolationLevel} timeout=${timeout}ms`,
        );

        await this.backoff(attempt);
      }
    }

    throw lastError;
  }

  private safeGetTx(): Prisma.TransactionClient | undefined {
    try {
      return (
        (this.ctx.isInContext()
          ? this.ctx.getTransaction<Prisma.TransactionClient>('prisma')
          : undefined) ?? undefined
      );
    } catch {
      return undefined;
    }
  }

  private isRetryable(error: unknown): boolean {
    // P2034 = “Transaction failed due to a write conflict or deadlock. Please retry.”
    // P2028 = “Transaction API error” (can happen with timeouts/closed tx; you might or might not want to retry)
    return (
      error instanceof PrismaNs.PrismaClientKnownRequestError &&
      (error.code === 'P2034' || error.code === 'P2028')
    );
  }

  private async backoff(attempt: number): Promise<void> {
    const delay = Math.min(100 * 2 ** attempt + Math.random() * 100, 5000);
    await new Promise((r) => setTimeout(r, delay));
  }
}
