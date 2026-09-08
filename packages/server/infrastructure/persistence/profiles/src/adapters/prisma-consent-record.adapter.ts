import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  ConsentRecordRepositoryPort,
  type ConsentRecordPersistence,
  type CreateConsentRecordInput,
  type ConsentRecordPersistenceQueryOptions,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient, withRlsAwareClient, buildPrismaSelect } from '@workspace/prisma';
import { MemberProfileConverter } from '../converter/member-profile.converter';

// RLS-protected table (docs/infrastructure/runbooks/db-rls-policies.sql) —
// SELECT is unrestricted there (consent may be recorded/read during
// registration/guest flows before an app.user_id resolves), so reads below
// stay plain; only create goes through withRlsAwareClient. No update/delete
// method exists on this port — consent records are append-only in practice
// (a new record supersedes, per findLatest's "most recent wins" read
// pattern), so there's nothing else to wrap.
@Injectable()
export class PrismaConsentRecordAdapter implements ConsentRecordRepositoryPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async create(
    data: CreateConsentRecordInput,
    tx?: DatabaseTx,
  ): Promise<ConsentRecordPersistence> {
    const row = await withRlsAwareClient(tx, this.prisma, (client) =>
      client.consentRecord.create({
        data: { id: generateId(IdPrefixes.CONSENT), ...data },
      }),
    );
    return { ...row, kind: MemberProfileConverter.consentKindOf(row) };
  }

  //Reads

  async findByProfile<K extends keyof ConsentRecordPersistence = keyof ConsentRecordPersistence>(
    profileId: string,
    options?: ConsentRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<ConsentRecordPersistence, K>[]> {
    return resolvePrismaClient(options?.tx, this.prisma).consentRecord.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      select: buildPrismaSelect<ConsentRecordPersistence, K>(options?.select),
    }) as Promise<Pick<ConsentRecordPersistence, K>[]>;
  }

  async findLatest<K extends keyof ConsentRecordPersistence = keyof ConsentRecordPersistence>(
    profileId: string,
    kind: ConsentRecordPersistence['kind'],
    options?: ConsentRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<ConsentRecordPersistence, K> | null> {
    return resolvePrismaClient(options?.tx, this.prisma).consentRecord.findFirst({
      where: { profileId, kind },
      orderBy: { createdAt: 'desc' },
      select: buildPrismaSelect<ConsentRecordPersistence, K>(options?.select),
    }) as Promise<Pick<ConsentRecordPersistence, K> | null>;
  }
}
