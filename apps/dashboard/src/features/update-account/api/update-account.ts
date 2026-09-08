'use server';
import { revalidatePath } from 'next/cache';
import { unwrap, ApiError } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';
import type { AccountFormState } from '../model/state';

/** Optional string → trimmed value or null (so cleared fields are sent as null). */
function optional(value: FormDataEntryValue | null): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  return s.length > 0 ? s : null;
}

export async function updateAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const client = await getServerApiClient();
  const body = {
    firstName: optional(formData.get('firstName')) ?? undefined,
    lastName: optional(formData.get('lastName')) ?? undefined,
    phone: optional(formData.get('phone')),
    country: optional(formData.get('country')),
    goal: optional(formData.get('goal')),
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  };
  try {
    unwrap(await client.PATCH('/api/v1/account', { body }));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Could not save your changes.';
    return { status: 'error', message };
  }
  revalidatePath('/account');
  return { status: 'success' };
}
