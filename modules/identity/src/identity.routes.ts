import { IdentityModule } from './identity.module';
import { ModuleRoutes } from '@workspace/types/contracts';

export { IDENTITY_CONTROLLER_PATHS } from './identity.paths';

/**
 * This module owns no shared sub-path — each controller declares its own
 * top-level resource path (see identity.paths.ts) on its own `@Controller(...)`.
 * So the module itself owns only '/', which collapses away under the app's
 * 'v1' parent (RouteTree concatenation + normalizePath turn 'v1' + '/' into
 * '/v1', not '/v1/') — leaving e.g. /v1/roles rather than /v1/identity/roles.
 */
export const identityRoutes: ModuleRoutes = { v1: [{ path: '/', module: IdentityModule }] };
