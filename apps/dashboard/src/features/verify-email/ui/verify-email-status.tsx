'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { buttonVariants, cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';
import { ErrorState } from '@/widgets/error-state';
import { verifyEmail } from '../api/verify-email';

type Status = { status: 'pending' } | Awaited<ReturnType<typeof verifyEmail>>;

/**
 * Fires the verification call on mount — public endpoint, no auth header
 * needed, so this is plain client-side `useEffect` rather than a form
 * submission. `useRef` guards against React 19 Strict Mode's intentional
 * double-invoke of effects in development firing the (single-use) token
 * twice.
 */
export function VerifyEmailStatus({ token }: { token: string }) {
  const [state, setState] = useState<Status>({ status: 'pending' });
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    void verifyEmail(token).then(setState);
  }, [token]);

  if (state.status === 'pending') {
    return <p className="text-sm text-muted-foreground">Verifying your email…</p>;
  }

  if (state.status === 'error') {
    return (
      <ErrorState
        title="Verification failed"
        description={state.message}
        action={
          <Link href="/account" className={cn(buttonVariants({ size: 'sm' }))}>
            Go to your account
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-lg bg-primary/12 text-primary"
      >
        <CheckCircle2 className="size-5" />
      </span>
      <p className="text-sm text-foreground">
        <span className="font-medium">{state.email}</span> is now verified.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
        Continue to your dashboard
      </Link>
    </div>
  );
}
