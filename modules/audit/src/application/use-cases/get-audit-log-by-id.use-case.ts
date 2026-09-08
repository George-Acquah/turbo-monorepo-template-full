import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_QUERY_PORT, type AuditLogDto, type AuditQueryPort } from '@workspace/ports';
import { AuditErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class GetAuditLogByIdUseCase {
  constructor(@Inject(AUDIT_QUERY_PORT) private readonly auditQuery: AuditQueryPort) {}

  async execute(id: string): Promise<AuditLogDto> {
    const log = await this.auditQuery.findAuditLogById(id);
    if (!log) throw new NotFoundAppException(AuditErrorCodes.AUDIT_LOG_NOT_FOUND, 'Audit log not found');
    return log;
  }
}
