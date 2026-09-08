import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes, type TwoFactorMethod } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  TwoFactorEnrollmentRepositoryPort,
  type TwoFactorEnrollmentPersistence,
  type CreateTwoFactorEnrollmentInput,
  type UpdateTwoFactorEnrollmentInput,
  type TwoFactorEnrollmentPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  buildPrismaSelect,
} from '@workspace/prisma';

@Injectable()
export class PrismaTwoFactorEnrollmentAdapter implements TwoFactorEnrollmentRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  create(
    data: CreateTwoFactorEnrollmentInput,
    tx?: DatabaseTx,
  ): Promise<TwoFactorEnrollmentPersistence> {
    const { id, ...rest } = data;
    return resolvePrismaClient(tx, this.prisma).twoFactorEnrollment.create({
      data: { id: id ?? generateId(IdPrefixes.TWO_FACTOR_ENROLLMENT), ...rest },
    });
  }

  update(
    id: string,
    data: UpdateTwoFactorEnrollmentInput,
    tx?: DatabaseTx,
  ): Promise<TwoFactorEnrollmentPersistence> {
    return resolvePrismaClient(tx, this.prisma).twoFactorEnrollment.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).twoFactorEnrollment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  //Reads

  findById<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    id: string,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).twoFactorEnrollment.findUnique({
      where: { id },
      select: buildPrismaSelect<TwoFactorEnrollmentPersistence, K>(options?.select),
    }) as Promise<Pick<TwoFactorEnrollmentPersistence, K> | null>;
  }

  findByMethod<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    userId: string,
    method: TwoFactorMethod,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).twoFactorEnrollment.findUnique({
      where: { userId_method: { userId, method } },
      select: buildPrismaSelect<TwoFactorEnrollmentPersistence, K>(options?.select),
    }) as Promise<Pick<TwoFactorEnrollmentPersistence, K> | null>;
  }

  findPrimaryForUser<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    userId: string,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).twoFactorEnrollment.findFirst({
      where: { userId, isPrimary: true, deletedAt: null },
      select: buildPrismaSelect<TwoFactorEnrollmentPersistence, K>(options?.select),
    }) as Promise<Pick<TwoFactorEnrollmentPersistence, K> | null>;
  }

  findActiveByUserId<
    K extends keyof TwoFactorEnrollmentPersistence = keyof TwoFactorEnrollmentPersistence,
  >(
    userId: string,
    options?: TwoFactorEnrollmentPersistenceQueryOptions<K>,
  ): Promise<Pick<TwoFactorEnrollmentPersistence, K>[]> {
    return resolvePrismaClient(options?.tx, this.prisma).twoFactorEnrollment.findMany({
      where: { userId, deletedAt: null },
      select: buildPrismaSelect<TwoFactorEnrollmentPersistence, K>(options?.select),
    }) as Promise<Pick<TwoFactorEnrollmentPersistence, K>[]>;
  }
}
