import { Controller, Header, Inject, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { JwtAuthGuard } from '@workspace/guards';
import { SkipRateLimit } from '@workspace/decorators';
import { SseService, type SseMessageEvent } from '../services/sse.service';

/**
 * RealtimeController — exposes a single SSE endpoint. Bare `@Controller()`
 * path/version: composed externally via `realtime.routes.ts` +
 * `apps/api/src/router.module.ts`'s `AppRoutingModule`, same as every other
 * bounded-context controller — the app owns the `v1`/global-prefix
 * composition, this final route is `GET /api/v1/realtime/stream`.
 *
 * Authentication:
 *   apps/members/apps/backoffice call the API cross-origin from the browser
 *   (see docs/infrastructure/architecture/deployment-topology.md — direct
 *   REST, no proxy). The native EventSource API can't set custom headers, so
 *   it relies on the `app_access_token` cookie instead — sent
 *   automatically because the cookie's `Domain` is scoped to the shared
 *   registrable domain (see each app's shared/lib/cookies.ts, `COOKIE_DOMAIN`)
 *   and the browser is asked to send it via `withCredentials: true`.
 *   JwtAuthGuard validates it the same way it does for ordinary REST endpoints.
 *
 * Usage (browser, from apps/members or apps/backoffice):
 * ```typescript
 * // apiBaseUrl = bare origin of apps/api, e.g. https://api.example.com —
 * // cross-origin by design, there is no same-origin relative path.
 * const es = new EventSource(`${apiBaseUrl}/api/v1/realtime/stream`, { withCredentials: true });
 * es.onmessage = (e) => console.log(JSON.parse(e.data));
 * ```
 *
 * Nginx buffering must be disabled in production for SSE to work; the
 * `X-Accel-Buffering: no` header instructs Nginx to pass bytes through
 * immediately instead of buffering the response.
 */
@UseGuards(JwtAuthGuard)
// Bare @Controller() — the 'realtime' segment is composed by
// realtime.routes.ts + AppRoutingModule, exactly as this class's own doc
// comment above states. Declaring it here too produced
// /api/v1/realtime/realtime/stream, so the documented and client-used path
// (/api/v1/realtime/stream) did not exist and every request 500'd.
@Controller()
export class RealtimeController {
  constructor(
    private readonly sseService: SseService,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Sse('stream')
  // A per-request-count policy is the wrong shape for a connection opened
  // once and held open indefinitely — a client stuck in a reconnect loop
  // could otherwise lock itself out of reconnecting. Real abuse protection
  // for this endpoint is a concurrent-connections-per-user cap inside
  // SseService, not the global HTTP rate-limit guard.
  @SkipRateLimit()
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache')
  stream(): Observable<SseMessageEvent> {
    const userId = this.context.getUserId();
    return this.sseService.subscribe(userId);
  }
}
