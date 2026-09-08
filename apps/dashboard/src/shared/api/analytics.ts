import 'server-only';
import { getServerApiClient } from './server';

/**
 * Fire-and-forget usage-event tracking (`POST /v1/analytics`, `modules/analytics`,
 * `@workspace/analytics`). Deliberately best-effort from the caller's side too, not just the
 * backend's: never awaited by call sites (`void trackEvent(...)`), and any failure here is
 * swallowed rather than thrown — a dropped analytics call must never block or surface an error
 * on the real user action it's attached to (programme view, enrolment start, lesson start).
 *
 * Uses `getServerApiClient()`, not `getPublicApiClient()` — it forwards the caller's access
 * token when one exists and sends no Authorization header otherwise, which matches the
 * endpoint's `OptionalAuthGuard`: an authenticated member's userId/profileId get attached
 * server-side, a guest's call still records anonymously (userId/profileId null).
 *
 * `properties` must stay feature/action identifiers only — never free-text user input or PII
 * beyond what's already collected elsewhere (see docs/product-analytics/context.md).
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const client = await getServerApiClient();
    const analyticsBody = {
      eventName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: properties as any,
    };
    await client.POST('/api/v1/analytics', { body: analyticsBody });
  } catch {
    // Best-effort — see doc comment above.
  }
}
