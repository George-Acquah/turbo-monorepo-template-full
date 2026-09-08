'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@workspace/client-ui-primitives';
import { createQueryClient } from '@/shared/config/query';

/**
 * App-wide client providers. TanStack Query is deliberately the only global client
 * context — reads happen in RSC via `@/shared/api/server`; Query is for the interactive
 * islands (tables, realtime) that need caching/optimistic updates.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
