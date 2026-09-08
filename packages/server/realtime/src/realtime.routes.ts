import { RealtimeModule } from './realtime.module';
import { ModuleRoutes } from '@workspace/types/contracts';

/**
 * This module's own route map. The app (apps/api's AppRoutingModule) imports
 * and aggregates these — composing the version prefix and any other
 * app-level nesting — so the module owns its sub-path ('realtime') while the
 * app owns how modules are assembled into the overall tree. Controllers stay
 * bare `@Controller()` and never declare their own prefix.
 */
export const REALTIME_CONTROLLER_PATHS = {
  REALTIME: 'realtime',
} as const;

export const realtimeRoutes: ModuleRoutes = {
  v1: [{ path: REALTIME_CONTROLLER_PATHS.REALTIME, module: RealtimeModule }],
};
