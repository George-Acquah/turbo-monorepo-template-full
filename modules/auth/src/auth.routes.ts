import { AuthModule } from './auth.module';
import { UserPreferencesModule } from './user-preferences.module';
import { ModuleRoutes } from '@workspace/types/contracts';
import { AUTH_CONTROLLER_PATHS } from './auth.paths';

export { AUTH_CONTROLLER_PATHS } from './auth.paths';

/**
 * This module's own route map. The app (apps/api's AppRoutingModule) imports
 * and aggregates these — composing the version prefix and any other
 * app-level nesting — so the module owns its sub-path ('auth') while the app
 * owns how modules are assembled into the overall tree.
 *
 * Two entries, not one: AuthModule's controllers stay bare `@Controller()`
 * under 'auth', but PreferencesModule mounts at '/' and its controller
 * declares PREFERENCES itself — app preferences aren't an authentication
 * operation, and /v1/auth/preferences would say they are.
 */
export const authRoutes: ModuleRoutes = {
  v1: [
    { path: AUTH_CONTROLLER_PATHS.AUTH, module: AuthModule },
    { path: '/', module: UserPreferencesModule },
  ],
};
