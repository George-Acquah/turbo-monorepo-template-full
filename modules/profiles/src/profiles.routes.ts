import { ProfilesModule } from './profiles.module';
import { ModuleRoutes } from '@workspace/types/contracts';

export { PROFILES_CONTROLLER_PATHS } from './profiles.paths';

/**
 * Profiles owns no shared sub-path — each controller declares its own
 * top-level resource path (see profiles.paths.ts). So the module itself owns
 * only '/', which collapses away under the app's 'v1' parent — leaving
 * /v1/account and /v1/consents rather than /v1/profiles/account.
 */
export const profilesRoutes: ModuleRoutes = { v1: [{ path: '/', module: ProfilesModule }] };
