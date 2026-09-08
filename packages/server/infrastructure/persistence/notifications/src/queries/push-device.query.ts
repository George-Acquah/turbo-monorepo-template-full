import { Inject, Injectable } from '@nestjs/common';
import type { PushDevicePersistence, PushDevicePersistenceQueryOptions } from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, buildPrismaSelect } from '@workspace/prisma';
import type { PushDevice as PrismaPushDeviceModel } from '@workspace/prisma/client';

type PushDeviceRow = Partial<PrismaPushDeviceModel>;

@Injectable()
export class PushDeviceQuery {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  findById<K extends keyof PushDevicePersistence>(
    id: string,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<PushDeviceRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).pushDevice.findUnique({
      where: { id },
      select: buildPrismaSelect<PushDevicePersistence, K>(options?.select),
    });
  }

  findByToken<K extends keyof PushDevicePersistence>(
    deviceToken: string,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<PushDeviceRow | null> {
    return resolvePrismaClient(options?.tx, this.prisma).pushDevice.findFirst({
      where: { deviceToken },
      select: buildPrismaSelect<PushDevicePersistence, K>(options?.select),
    });
  }

  listUserDevices<K extends keyof PushDevicePersistence>(
    userId: string,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<PushDeviceRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).pushDevice.findMany({
      where: { userId },
      select: buildPrismaSelect<PushDevicePersistence, K>(options?.select),
    });
  }

  listActiveUserDevices<K extends keyof PushDevicePersistence>(
    userId: string,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<PushDeviceRow[]> {
    return resolvePrismaClient(options?.tx, this.prisma).pushDevice.findMany({
      where: { userId, isActive: true },
      select: buildPrismaSelect<PushDevicePersistence, K>(options?.select),
    });
  }
}
