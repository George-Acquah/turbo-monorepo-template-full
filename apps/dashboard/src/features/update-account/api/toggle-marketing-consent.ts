'use server';
import { revalidatePath } from 'next/cache';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';

/**
 * A focused sibling to `updateAccount` — that action is bound to `AccountForm`'s
 * `useActionState`/`FormData` shape, so a single-field toggle calls `PATCH /account`
 * directly instead of round-tripping through a form action built for the full form.
 */
export async function toggleMarketingConsent(marketingOptIn: boolean): Promise<void> {
  const client = await getServerApiClient();
  unwrap(await client.PATCH('/api/v1/account', { body: { marketingOptIn } }));
  revalidatePath('/account');
}
