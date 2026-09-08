import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  UserDeviceRepositoryPort,
  type UserDevicePersistence,
  type CreateUserDeviceInput,
  type UpdateUserDeviceInput,
  type UserDevicePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import {
  PrismaService,
  PRISMA_CLIENT_TOKEN,
  resolvePrismaClient,
  withRlsAwareClient,
  buildPrismaSelect,
} from '@workspace/prisma';

// RLS-protected table (docs/infrastructure/runbooks/db-rls-policies.sql) —
// SELECT is unrestricted there (matches this table's read patterns, used
// during device-fingerprint/MFA-bypass checks before full auth context may
// exist), so reads below stay on plain resolvePrismaClient; only
// create/update (the ownership-relevant mutations) go through
// withRlsAwareClient.
@Injectable()
export class PrismaUserDeviceAdapter implements UserDeviceRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  create(data: CreateUserDeviceInput, tx?: DatabaseTx): Promise<UserDevicePersistence> {
    const { id, ...rest } = data;
    return withRlsAwareClient(tx, this.prisma, (client) =>
      client.userDevice.create({
        data: { id: id ?? generateId(IdPrefixes.USER_DEVICE), ...rest },
      }),
    );
  }

  update(
    id: string,
    data: UpdateUserDeviceInput,
    tx?: DatabaseTx,
  ): Promise<UserDevicePersistence> {
    return withRlsAwareClient(tx, this.prisma, (client) =>
      client.userDevice.update({ where: { id }, data }),
    );
  }

  setDeviceTrust(
    id: string,
    trusted: boolean,
    trustedBy?: string,
    tx?: DatabaseTx,
  ): Promise<UserDevicePersistence> {
    return withRlsAwareClient(tx, this.prisma, (client) =>
      client.userDevice.update({
        where: { id },
        data: {
          trusted,
          trustedAt: trusted ? new Date() : null,
          trustedBy: trusted ? (trustedBy ?? null) : null,
        },
      }),
    );
  }

  //Reads

  findById<K extends keyof UserDevicePersistence = keyof UserDevicePersistence>(
    id: string,
    options?: UserDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<UserDevicePersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).userDevice.findUnique({
      where: { id },
      select: buildPrismaSelect<UserDevicePersistence, K>(options?.select),
    }) as Promise<Pick<UserDevicePersistence, K> | null>;
  }

  findByFingerprint<K extends keyof UserDevicePersistence = keyof UserDevicePersistence>(
    userId: string,
    fingerprintHash: string,
    options?: UserDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<UserDevicePersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).userDevice.findUnique({
      where: { userId_fingerprintHash: { userId, fingerprintHash } },
      select: buildPrismaSelect<UserDevicePersistence, K>(options?.select),
    }) as Promise<Pick<UserDevicePersistence, K> | null>;
  }

  findByUserId<K extends keyof UserDevicePersistence = keyof UserDevicePersistence>(
    userId: string,
    options?: UserDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<UserDevicePersistence, K>[]> {
    return resolvePrismaClient(options?.tx, this.prisma).userDevice.findMany({
      where: { userId },
      select: buildPrismaSelect<UserDevicePersistence, K>(options?.select),
    }) as Promise<Pick<UserDevicePersistence, K>[]>;
  }
}
