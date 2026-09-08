'use client';
import { createContext, useContext } from 'react';
import { useRealtimeStream } from '@workspace/client-hooks';
import { toast } from '@workspace/client-ui-primitives';
import type { RealtimeEvent } from '@workspace/client-types';
import { useRouter } from 'next/navigation';
import { env } from '@/shared/config/env';

const RealtimeContext = createContext<RealtimeEvent<unknown> | null>(null);

/** The latest frame received on the shared SSE connection, or null before the first one. */
export function useRealtimeEvent(): RealtimeEvent<unknown> | null {
  return useContext(RealtimeContext);
}

/**
 * Opens the ONE SSE connection this app needs and fans it out via context —
 * every consumer (this provider's own toast+refresh behavior, the
 * notifications bell) reads from the same stream via `useRealtimeEvent`
 * rather than each calling `useRealtimeStream` independently, which would
 * open a redundant connection per consumer (SseService caps concurrent
 * streams per user).
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { lastEvent } = useRealtimeStream({
    apiBaseUrl: env.apiUrl,
    onEvent: (event) => {
      if (
        [
          'workspace.enrolments.enrolment.activated',
          'workspace.enrolments.enrolment.activated.v2',
          'workspace.memberships.access-grant.granted',
          'workspace.memberships.grant.created.v2',
          'workspace.memberships.grant.revoked.v2',
          'workspace.billing.payment.succeeded',
          'workspace.indicators.access.granted.v2',
          'workspace.indicators.access.revoked.v2',
        ].includes(event.eventType)
      ) {
        toast.success('Your access was updated.');
        router.refresh();
      }
    },
  });

  return <RealtimeContext.Provider value={lastEvent}>{children}</RealtimeContext.Provider>;
}
