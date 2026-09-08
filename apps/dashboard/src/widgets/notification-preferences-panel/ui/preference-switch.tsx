'use client';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@workspace/client-ui-primitives';
import type { components } from '@workspace/client-types';
import { updateNotificationPreference } from '../api/update-notification-preference';

type UpdateDto = components['schemas']['UpdateNotificationPreferenceDto'];

/** One matrix cell. Same optimistic-then-persist pattern as `MarketingConsentToggle`: the
 *  switch moves on click, the server call reconciles in the background. */
export function PreferenceSwitch({
  category,
  channel,
  enabled,
}: {
  category: UpdateDto['category'];
  channel: UpdateDto['channel'];
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(enabled);
  const router = useRouter();

  return (
    <Switch
      checked={optimistic}
      disabled={pending}
      aria-label={`${channel} notifications for ${category}`}
      onCheckedChange={(next) =>
        startTransition(async () => {
          setOptimistic(next);
          await updateNotificationPreference(category, channel, next);
          router.refresh();
        })
      }
    />
  );
}
