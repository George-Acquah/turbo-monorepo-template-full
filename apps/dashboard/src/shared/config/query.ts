import { QueryClient } from '@tanstack/react-query';

/** One QueryClient per browser session (created in Providers). Reads default to a short
 *  stale window; tune per-query. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
