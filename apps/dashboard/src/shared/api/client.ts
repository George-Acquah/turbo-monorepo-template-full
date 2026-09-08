'use client';

import { createClientFetcher, type ApiClient } from '@workspace/client-api';
import { env } from '@/shared/config/env';

/**
 * Browser API client — used inside client islands (TanStack Query mutations/queries).
 * Auth travels via the httpOnly cookie the browser sends automatically; no token handling
 * here. For RSC reads, use `@/shared/api/server` instead.
 */
export const apiClient: ApiClient = createClientFetcher({
  baseUrl: env.apiUrl,
});
