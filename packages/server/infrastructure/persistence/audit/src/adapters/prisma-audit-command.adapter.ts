import { Inject, Injectable } from '@nestjs/common';
import { IdPrefixes } from '@workspace/constants';
import { generateId } from '@workspace/utils';
import {
  AuditCommandPort,
  type AuditLogDto,
  type AuditLogInput,
  type SystemEventDto,
  type SystemEventInput,
  type ApiLogDto,
  type ApiLogInput,
  type JobLogDto,
  type JobLogInput,
  type LoginAttemptDto,
  type LoginAttemptInput,
  type DatabaseTx,
} from '@workspace/ports';
import { PrismaService, PRISMA_CLIENT_TOKEN, resolvePrismaClient } from '@workspace/prisma';
import { AuditConverter } from '../converter/audit.converter';

@Injectable()
export class PrismaAuditCommandAdapter implements AuditCommandPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async createAuditLog(data: AuditLogInput, tx?: DatabaseTx): Promise<AuditLogDto> {
    const { occurredAt, actorType, oldValues, newValues, metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).auditLog.create({
      data: {
        id: generateId(IdPrefixes.AUDIT_LOG),
        ...rest,
        actorType: actorType ?? 'system',
        oldValues: oldValues ?? undefined,
        newValues: newValues ?? undefined,
        metadata: metadata ?? undefined,
        createdAt: occurredAt ?? undefined,
      },
    });
    return AuditConverter.toAuditLogDto(row);
  }

  async createSystemEvent(data: SystemEventInput, tx?: DatabaseTx): Promise<SystemEventDto> {
    const { occurredAt, message, metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).systemEvent.create({
      data: {
        id: generateId(IdPrefixes.SYSTEM_EVENT),
        ...rest,
        message: message ?? undefined,
        metadata: metadata ?? undefined,
        createdAt: occurredAt ?? undefined,
      },
    });
    return AuditConverter.toSystemEventDto(row);
  }

  async createApiLog(data: ApiLogInput, tx?: DatabaseTx): Promise<ApiLogDto> {
    const { occurredAt, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).apiLog.create({
      data: { id: generateId(IdPrefixes.API_LOG), ...rest, createdAt: occurredAt },
    });
    return AuditConverter.toApiLogDto(row);
  }

  async createJobLog(data: JobLogInput, tx?: DatabaseTx): Promise<JobLogDto> {
    const { metadata, ...rest } = data;
    const row = await resolvePrismaClient(tx, this.prisma).jobLog.create({
      data: { id: generateId(IdPrefixes.JOB_LOG), ...rest, metadata: metadata ?? undefined },
    });
    return AuditConverter.toJobLogDto(row);
  }

  async createLoginAttempt(data: LoginAttemptInput, tx?: DatabaseTx): Promise<LoginAttemptDto> {
    const row = await resolvePrismaClient(tx, this.prisma).loginAttempt.create({
      data: { id: generateId(IdPrefixes.LOGIN_ATTEMPT), ...data },
    });
    return AuditConverter.toLoginAttemptDto(row);
  }
}
