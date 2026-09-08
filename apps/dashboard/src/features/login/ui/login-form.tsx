'use client';

import { useActionState, useState } from 'react';
import { TurnstileWidget } from '@workspace/client-turnstile';
import { AuthField, AuthSubmit } from '@/widgets/auth-shell';
import { env } from '@/shared/config';
import { login } from '../api/login';
import { initialAuthState } from '../model/state';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialAuthState);
  const [turnstileToken, setTurnstileToken] = useState('');

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <AuthField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        errors={state.fieldErrors}
      />
      <AuthField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors}
      />

      <TurnstileWidget
        siteKey={env.turnstileSiteKey ?? ''}
        onVerified={setTurnstileToken}
        onExpired={() => setTurnstileToken('')}
      />
      <input type="hidden" name="turnstileToken" value={turnstileToken} />

      <AuthSubmit pending={pending}>Sign in</AuthSubmit>
    </form>
  );
}
