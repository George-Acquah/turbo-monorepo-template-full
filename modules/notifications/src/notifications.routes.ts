import { NotificationsModule } from './notifications.module';
import { ModuleRoutes } from '@workspace/types/contracts';

export { NOTIFICATIONS_CONTROLLER_PATHS } from './notifications.paths';

/**
 * No shared sub-path — the controller declares its own top-level resource (see
 * notifications.paths.ts), so the module owns only '/', which collapses under the app's 'v1'
 * parent. Yields /v1/notification-preferences rather than /v1/notifications/preferences.
 * Same shape as profilesRoutes.
 */
export const notificationsRoutes: ModuleRoutes = { v1: [{ path: '/', module: NotificationsModule }] };
