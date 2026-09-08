import type { Provider } from '@nestjs/common';
import { AUDIT_COMMAND_PORT, AUDIT_QUERY_PORT } from '@workspace/ports';
import { PrismaAuditCommandAdapter, PrismaAuditQueryAdapter } from '../adapters';

export const AUDIT_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaAuditCommandAdapter,
  { provide: AUDIT_COMMAND_PORT, useExisting: PrismaAuditCommandAdapter },

  PrismaAuditQueryAdapter,
  { provide: AUDIT_QUERY_PORT, useExisting: PrismaAuditQueryAdapter },
];

export const AUDIT_PERSISTENCE_TOKENS = [AUDIT_COMMAND_PORT, AUDIT_QUERY_PORT];
