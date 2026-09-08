import { Inject, Injectable } from '@nestjs/common';
import type { UserPersistence, UserPersistenceQueryOptions } from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';
import type { User as PrismaUser } from '@workspace/prisma/client';

// Prisma's dynamic `select` can't be statically narrowed to Pick<P,K> by the
// type system (select is built at runtime from the generic K). The query
// layer returns a loosely-typed row; the adapter asserts the final Pick<P,K>
// shape at the port boundary — the port's own EntitySelectPath comment
// documents this same trade-off.
type UserRow = Partial<PrismaUser>;

@Injectable()
export class UserQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof UserPersistence = keyof UserPersistence>(
    id: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<UserRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).user.findUnique({
      where: { id },
      select: buildPrismaSelect<UserPersistence, K>(options?.select),
    });
  }

  findByEmail<K extends keyof UserPersistence = keyof UserPersistence>(
    email: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<UserRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).user.findUnique({
      where: { email },
      select: buildPrismaSelect<UserPersistence, K>(options?.select),
    });
  }

  findByPhone<K extends keyof UserPersistence = keyof UserPersistence>(
    phone: string,
    options?: UserPersistenceQueryOptions<K>,
  ): Promise<UserRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).user.findUnique({
      where: { phone },
      select: buildPrismaSelect<UserPersistence, K>(options?.select),
    });
  }
}
