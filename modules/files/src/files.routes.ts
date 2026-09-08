import { FilesModule } from './files.module';
import { ModuleRoutes } from '@workspace/types/contracts';

export { FILES_CONTROLLER_PATHS } from './files.paths';

/**
 * `FilesController` already declares its own top-level `files` path (see
 * files.paths.ts), so the module itself owns only '/', which collapses away
 * under the app's 'v1' parent — leaving `/v1/files/*` rather than
 * `/v1/files/files/*`. Same shape as learning/events/billing/enrolments.
 */
export const filesRoutes: ModuleRoutes = { v1: [{ path: '/', module: FilesModule }] };
