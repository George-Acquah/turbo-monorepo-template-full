'use client';

import { useActionState } from 'react';
import { AuthField, AuthSubmit } from '@/widgets/auth-shell';
import { initialAuthState } from '@/features/login';
import { claimAccount } from '../api/claim-account';

export function ClaimAccountForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(claimAccount, initialAuthState);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <input type="hidden" name="claimToken" value={token} />
      <AuthField
        name="password"
        label="Choose a password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors}
      />

      <AuthSubmit pending={pending}>Set up account</AuthSubmit>
    </form>
  );
}
