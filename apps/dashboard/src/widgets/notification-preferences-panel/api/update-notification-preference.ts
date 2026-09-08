'use server';
import { revalidatePath } from 'next/cache';
import { unwrap } from '@workspace/client-api';
import type { components } from '@workspace/client-types';
import { getServerApiClient } from '@/shared/api';

type UpdateDto = components['schemas']['UpdateNotificationPreferenceDto'];

export async function updateNotificationPreference(
  category: UpdateDto['category'],
  channel: UpdateDto['channel'],
  enabled: boolean,
): Promise<void> {
  const client = await getServerApiClient();
  unwrap(await client.PATCH('/api/v1/notification-preferences', { body: { category, channel, enabled } }));
  revalidatePath('/account/preferences');
}
