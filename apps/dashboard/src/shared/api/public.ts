import 'server-only';
import { createApiClient, type ApiClient } from '@workspace/client-api';
import { env } from '@/shared/config/env';

/**
 * Unauthenticated server client for the public catalog/event reads
 * (`/programmes`, `/events`, …) that don't need — and shouldn't require — a
 * session. Screens behind the auth gate still use `getServerApiClient()`.
 */
export function getPublicApiClient(): ApiClient {
  return createApiClient({ baseUrl: env.apiUrl });
}
