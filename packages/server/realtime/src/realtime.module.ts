import { Module } from '@nestjs/common';
import { SseService } from './services/sse.service';
import { RealtimeController } from './controllers/realtime.controller';

/**
 * RealtimeModule — provides SSE streaming for the workspace API.
 *
 * Depends on:
 *   - `RedisModule` (global) for `REDIS_SUBSCRIBER_FACTORY_TOKEN`
 *   - `AppContextModule` (global) for `CONTEXT_TOKEN`
 *   - `@workspace/guards` for `JwtAuthGuard` (a plain zero-dependency class,
 *     no module import needed — it's used directly in the controller)
 *   - `AuthCoreModule` (global, published as `@workspace/auth-core`) for
 *     registering the `'jwt'` Passport strategy `JwtAuthGuard` resolves by
 *     name at runtime
 *
 * `RedisModule`/`AppContextModule`/`AuthCoreModule` are already imported as
 * global modules in `AppModule`, so no explicit import is needed here.
 *
 * This module itself is composed into the app via `realtime.routes.ts` +
 * `apps/api/src/router.module.ts`'s `AppRoutingModule` (not imported directly
 * into `AppModule`) — same as every other bounded-context module.
 */
@Module({
  imports: [],
  controllers: [RealtimeController],
  providers: [SseService],
  exports: [SseService],
})
export class RealtimeModule {}
