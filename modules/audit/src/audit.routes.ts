import { AuditModule } from './audit.module';
import { ModuleRoutes } from '@workspace/types/contracts';

/**
 * This module's own route map. The app (apps/api's AppRoutingModule) imports
 * and aggregates these — the module owns its sub-path ('audit') while the
 * app owns how modules are assembled into the overall tree.
 */
export const AUDIT_CONTROLLER_PATHS = {
  AUDIT: 'audit',
} as const;

export const auditRoutes: ModuleRoutes = {
  v1: [{ path: AUDIT_CONTROLLER_PATHS.AUDIT, module: AuditModule }],
};
