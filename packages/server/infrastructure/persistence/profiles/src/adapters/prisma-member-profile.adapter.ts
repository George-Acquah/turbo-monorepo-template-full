import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  MemberProfileRepositoryPort,
  type MemberProfilePersistence,
  type CreateMemberProfileInput,
  type UpdateMemberProfileInput,
  type MemberProfilePersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { MemberProfileConverter } from '../converter/member-profile.converter';
import { MemberProfileQuery } from '../queries/member-profile.query';

@Injectable()
export class PrismaMemberProfileAdapter implements MemberProfileRepositoryPort {
  constructor(
    @Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService,
    private readonly profileQuery: MemberProfileQuery,
  ) {}

  async create(
    data: CreateMemberProfileInput,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence> {
    const { id, metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).memberProfile.create({
      data: {
        id: id ?? generateId(IdPrefixes.PROFILE),
        ...rest,
        metadata: metadata ?? undefined,
      },
    });
    return MemberProfileConverter.toPersistence(row);
  }

  async update(
    id: string,
    data: UpdateMemberProfileInput,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence> {
    const { metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).memberProfile.update({
      where: { id },
      data: { ...rest, metadata: metadata ?? undefined },
    });
    return MemberProfileConverter.toPersistence(row);
  }

  async linkUser(
    id: string,
    userId: string,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence> {
    const row = await resolvePrismaClient(tx, this.prisma).memberProfile.update({
      where: { id },
      data: { userId },
    });
    return MemberProfileConverter.toPersistence(row);
  }

  async softDelete(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(tx, this.prisma).memberProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  //Reads

  async findById<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    id: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<Pick<MemberProfilePersistence, K> | null> {
    const row = await this.profileQuery.findById(id, options);
    return row
      ? (MemberProfileConverter.toPartialPersistence(row) as Pick<MemberProfilePersistence, K>)
      : null;
  }

  async findByEmail<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    email: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<Pick<MemberProfilePersistence, K> | null> {
    const row = await this.profileQuery.findByEmail(email.toLowerCase(), options);
    return row
      ? (MemberProfileConverter.toPartialPersistence(row) as Pick<MemberProfilePersistence, K>)
      : null;
  }

  async findByUserId<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    userId: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<Pick<MemberProfilePersistence, K> | null> {
    const row = await this.profileQuery.findByUserId(userId, options);
    return row
      ? (MemberProfileConverter.toPartialPersistence(row) as Pick<MemberProfilePersistence, K>)
      : null;
  }

  async listActive(input: {
    afterId?: string;
    limit: number;
  }): Promise<Array<Pick<MemberProfilePersistence, 'id' | 'userId'>>> {
    const rows = await this.profileQuery.listActive(input);
    return rows.map((row) => ({ id: row.id!, userId: row.userId ?? null }));
  }
}
