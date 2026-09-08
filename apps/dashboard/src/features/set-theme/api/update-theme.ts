'use server';
import { revalidatePath } from 'next/cache';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';
import { toBackendTheme, type ThemePreference } from '@/shared/lib/theme';

/**
 * Persists the theme to the account (`/v1/preferences`) so it follows the member across
 * devices. `applyTheme` (client-side) already made the change feel instant on this device via
 * the cookie — this is the background write that makes it the real, cross-device value.
 */
export async function updateThemePreference(theme: ThemePreference): Promise<void> {
  const client = await getServerApiClient();
  unwrap(await client.PATCH('/api/v1/preferences', { body: { theme: toBackendTheme(theme) } }));
  revalidatePath('/account/preferences');
}
