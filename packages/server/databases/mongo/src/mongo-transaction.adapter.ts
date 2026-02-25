import { Inject, Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { CONTEXT_TOKEN, ContextPort, LOGGER_TOKEN, LoggerPort, TransactionPort } from '@repo/ports';
import { MongoService } from './mongo.service';

@Injectable()
export class MongoTransactionAdapter implements TransactionPort {
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_TIMEOUT = 10_000;

  constructor(
    private readonly mongo: MongoService,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(CONTEXT_TOKEN) private readonly ctx: ContextPort,
  ) {}

  async withTx<T>(fn: (tx: ClientSession) => Promise<T>): Promise<T> {
    const existing = this.safeGetTx();
    if (existing) {
      return fn(existing);
    }

    return this.execute(fn);
  }

  async execute<T>(
    operation: (tx: ClientSession) => Promise<T>,
    options?: {
      maxRetries?: number;
      isolationLevel?: unknown;
      timeout?: number;
    },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.DEFAULT_MAX_RETRIES;
    const timeout = options?.timeout ?? this.DEFAULT_TIMEOUT;

    const existing = this.safeGetTx();
    if (existing) {
      return operation(existing);
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      const session = await this.mongo.getConnection().startSession();
      try {
        const result = await session.withTransaction(
          async () => {
            const hasContext = this.ctx.isInContext();
            const previous = hasContext ? this.safeGetTx() : undefined;

            if (hasContext) {
              this.ctx.setPrismaTransaction(session);
            }

            try {
              return await operation(session);
            } finally {
              if (hasContext) {
                if (previous) {
                  this.ctx.setPrismaTransaction(previous);
                } else {
                  this.ctx.setPrismaTransaction(undefined);
                }
              }
            }
          },
          { maxCommitTimeMS: timeout },
        );

        if (result === undefined) {
          throw new Error('Mongo transaction aborted');
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt += 1;

        if (!this.isRetryable(error) || attempt >= maxRetries) {
          throw error;
        }

        this.logger.warn(`[tx] mongo retryable conflict (${attempt}/${maxRetries}) timeout=${timeout}ms`);
        await this.backoff(attempt);
      } finally {
        await session.endSession();
      }
    }

    throw lastError;
  }

  private safeGetTx(): ClientSession | undefined {
    try {
      if (!this.ctx.isInContext()) {
        return undefined;
      }

      return this.ctx.getPrismaTransaction<ClientSession>();
    } catch {
      return undefined;
    }
  }

  private isRetryable(error: unknown): boolean {
    const labels = (error as { errorLabels?: unknown })?.errorLabels;
    if (!Array.isArray(labels)) {
      return false;
    }

    return labels.includes('TransientTransactionError') || labels.includes('UnknownTransactionCommitResult');
  }

  private async backoff(attempt: number): Promise<void> {
    const delay = Math.min(100 * 2 ** attempt + Math.random() * 100, 5000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
