'use client';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@workspace/client-ui-primitives';
import { toggleMarketingConsent } from '@/features/update-account';

/**
 * `useOptimistic` so the switch moves on the click rather than after the round-trip — a settings
 * toggle that lags feels broken even when it's working. React reverts it automatically if the
 * action throws, and `router.refresh()` reconciles against the server's actual value.
 */
export function MarketingConsentToggle({ optedIn }: { optedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(optedIn);
  const router = useRouter();

  return (
    <Switch
      checked={optimistic}
      disabled={pending}
      aria-label="Marketing email"
      onCheckedChange={(next) =>
        startTransition(async () => {
          setOptimistic(next);
          await toggleMarketingConsent(next);
          router.refresh();
        })
      }
    />
  );
}
