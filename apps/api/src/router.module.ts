import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuditModule, auditRoutes } from '@workspace/audit';
import { AuthModule, UserPreferencesModule, authRoutes } from '@workspace/auth';
import { IdentityModule, identityRoutes } from '@workspace/identity';
import { ProfilesModule, profilesRoutes } from '@workspace/profiles';
import { FilesModule, filesRoutes } from '@workspace/files';
import { NotificationsModule, notificationsRoutes } from '@workspace/notifications';
import { RealtimeModule, realtimeRoutes } from '@workspace/realtime';
import { routeVersionKeys } from '@workspace/constants';
import { MetricsModule } from './metrics/metrics.module';

/**
 * AppRoutingModule — single source of truth for the app's route tree. Each
 * bounded-context module owns its own route map (e.g. `authRoutes`) and is
 * aggregated here; the app decides the version prefix and how modules nest.
 * Feature modules never declare their own path prefix (bare `@Controller()`)
 * — except identity/profiles/notifications, which own their own top-level
 * resource path(s) instead of relying on a bare controller (see each module's
 * own `*.paths.ts`).
 *
 * `NotificationsModule` here is the HTTP half only (member self-service
 * preferences). Sending stays in `NotificationsWorkerModule`, which apps/worker
 * imports and apps/api does not.
 *
 * Add a module by importing it into `featureModules` and spreading its route
 * map into the `v1` children. See https://docs.nestjs.com/recipes/router-module.
 */
const featureModules = [
  AuthModule,
  // Same bounded context as AuthModule, separate composition root so its controller can mount at
  // /v1/preferences rather than under AuthModule's 'auth' prefix.
  UserPreferencesModule,
  AuditModule,
  IdentityModule,
  ProfilesModule,
  FilesModule,
  NotificationsModule,
  RealtimeModule,
  MetricsModule,
];

@Module({
  imports: [
    ...featureModules,
    RouterModule.register([
      {
        path: routeVersionKeys.v1,
        children: [
          ...(authRoutes[routeVersionKeys.v1] ?? []),
          ...(auditRoutes[routeVersionKeys.v1] ?? []),
          ...(identityRoutes[routeVersionKeys.v1] ?? []),
          ...(profilesRoutes[routeVersionKeys.v1] ?? []),
          ...(filesRoutes[routeVersionKeys.v1] ?? []),
          ...(notificationsRoutes[routeVersionKeys.v1] ?? []),
          ...(realtimeRoutes[routeVersionKeys.v1] ?? []),
          // App-level admin reporting (not a bounded-context module). Its controller
          // owns the `admin/metrics` sub-path; mapping to '/' collapses under 'v1'.
          { path: '/', module: MetricsModule },
        ],
      },
    ]),
  ],
})
export class AppRoutingModule {}
