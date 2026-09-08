import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes, type AuthProvider } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  UserAuthProviderRepositoryPort,
  type UserAuthProviderPersistence,
  type CreateUserAuthProviderInput,
  type UpdateUserAuthProviderInput,
  type UserAuthProviderPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';

// Not part of the original scaffold — UserAuthProviderRepositoryPort exists
// (Google/GitHub OAuth need it) but had no scaffolded adapter file. Added to
// keep auth-persistence's coverage of the auth ports complete.
@Injectable()
export class PrismaUserAuthProviderAdapter implements UserAuthProviderRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  create(
    data: CreateUserAuthProviderInput,
    tx?: DatabaseTx,
  ): Promise<UserAuthProviderPersistence> {
    const { id, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).userAuthProvider.create({
      data: { id: id ?? generateId(IdPrefixes.USER_AUTH_PROVIDER), ...rest },
    });
  }

  update(
    id: string,
    data: UpdateUserAuthProviderInput,
    tx?: DatabaseTx,
  ): Promise<UserAuthProviderPersistence> {
    return resolvePrismaClient(tx, this.prisma).userAuthProvider.update({ where: { id }, data });
  }

  async delete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).userAuthProvider.delete({ where: { id } });
  }

  //Reads

  findById<
    K extends keyof UserAuthProviderPersistence = keyof UserAuthProviderPersistence,
  >(
    id: string,
    options?: UserAuthProviderPersistenceQueryOptions<K>,
  ): Promise<Pick<UserAuthProviderPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).userAuthProvider.findUnique({
      where: { id },
      select: buildPrismaSelect<UserAuthProviderPersistence, K>(options?.select),
    }) as Promise<Pick<UserAuthProviderPersistence, K> | null>;
  }

  findByProviderId<
    K extends keyof UserAuthProviderPersistence = keyof UserAuthProviderPersistence,
  >(
    provider: AuthProvider,
    providerId: string,
    options?: UserAuthProviderPersistenceQueryOptions<K>,
  ): Promise<Pick<UserAuthProviderPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).userAuthProvider.findUnique({
      where: { provider_providerId: { provider, providerId } },
      select: buildPrismaSelect<UserAuthProviderPersistence, K>(options?.select),
    }) as Promise<Pick<UserAuthProviderPersistence, K> | null>;
  }

  findByUserId<
    K extends keyof UserAuthProviderPersistence = keyof UserAuthProviderPersistence,
  >(
    userId: string,
    options?: UserAuthProviderPersistenceQueryOptions<K>,
  ): Promise<Pick<UserAuthProviderPersistence, K>[]> {
    return resolvePrismaClient(options?.tx, this.prisma).userAuthProvider.findMany({
      where: { userId },
      select: buildPrismaSelect<UserAuthProviderPersistence, K>(options?.select),
    }) as Promise<Pick<UserAuthProviderPersistence, K>[]>;
  }
}
