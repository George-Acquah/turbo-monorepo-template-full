import { Inject, Injectable } from '@nestjs/common';
import type {
  IdempotencyKeyPersistence,
  IdempotencyKeyPersistenceQueryOptions,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { IdempotencyKey as PrismaIdempotencyKeyModel } from '@workspace/prisma/client';

type IdempotencyKeyRow = Partial<PrismaIdempotencyKeyModel>;

@Injectable()
export class IdempotencyKeyQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findByKey<K extends keyof IdempotencyKeyPersistence>(
    scope: string,
    key: string,
    tx?: unknown,
    options?: IdempotencyKeyPersistenceQueryOptions<K>,
  ): Promise<IdempotencyKeyRow | null> {
    return resolvePrismaClient(tx, this.prisma).idempotencyKey.findUnique({
      where: { scope_key: { scope, key } },
      select: buildPrismaSelect<IdempotencyKeyPersistence, K>(options?.select),
    });
  }
}
