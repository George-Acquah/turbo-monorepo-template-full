import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  PushDeviceRepositoryPort,
  type PushDevicePersistence,
  type RegisterPushDeviceInput,
  type PushDevicePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { NotificationConfigConverter } from '../converter/notification-config.converter';
import { PushDeviceQuery } from '../queries/push-device.query';

@Injectable()
export class PrismaPushDeviceAdapter implements PushDeviceRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly pushDeviceQuery: PushDeviceQuery,
  ) {}

  async register<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    data: RegisterPushDeviceInput,
    tx?: DatabaseTx,
  ): Promise<Pick<PushDevicePersistence, K>> {
    const { userId, deviceToken, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).pushDevice.upsert({
      where: { userId_deviceToken: { userId, deviceToken } },
      create: {
        id: generateId(IdPrefixes.PUSH_DEVICE),
        userId,
        deviceToken,
        ...rest,
        isActive: true,
      },
      update: { ...rest, isActive: true },
    });
    return NotificationConfigConverter.toPushDevicePersistence(row) as Pick<PushDevicePersistence, K>;
  }

  async findById<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    id: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K> | null> {
    const row = await this.pushDeviceQuery.findById(id, { ...options, tx });
    return row
      ? (NotificationConfigConverter.toPushDevicePartialPersistence(row) as Pick<
          PushDevicePersistence,
          K
        >)
      : null;
  }

  async findByToken<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    token: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K> | null> {
    const row = await this.pushDeviceQuery.findByToken(token, { ...options, tx });
    return row
      ? (NotificationConfigConverter.toPushDevicePartialPersistence(row) as Pick<
          PushDevicePersistence,
          K
        >)
      : null;
  }

  async listUserDevices<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    userId: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K>[]> {
    const rows = await this.pushDeviceQuery.listUserDevices(userId, { ...options, tx });
    return rows.map(
      (row) =>
        NotificationConfigConverter.toPushDevicePartialPersistence(row) as Pick<
          PushDevicePersistence,
          K
        >,
    );
  }

  async listActiveUserDevices<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    userId: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K>[]> {
    const rows = await this.pushDeviceQuery.listActiveUserDevices(userId, { ...options, tx });
    return rows.map(
      (row) =>
        NotificationConfigConverter.toPushDevicePartialPersistence(row) as Pick<
          PushDevicePersistence,
          K
        >,
    );
  }

  async markSeen(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).pushDevice.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async deactivate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).pushDevice.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).pushDevice.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
