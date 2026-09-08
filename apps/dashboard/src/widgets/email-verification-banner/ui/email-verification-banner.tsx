'use client';

import { useState } from 'react';
import { Button } from '@workspace/client-ui-primitives';
import { resendVerificationEmail } from '@/features/resend-verification';
import { EMAIL_VERIFICATION_BANNER_DISMISSED_COOKIE } from '@/shared/lib/cookie-names';

// 30 days: long enough that a dismissal actually sticks (not just "for this tab"), short
// enough that a still-unverified account gets reminded again eventually rather than never.
const DISMISS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SendState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Soft, dismissible reminder — NOT a gate. Nothing in this workstream blocks
 * any feature on `emailVerified`; this banner is the entire user-facing
 * surface of that fact.
 *
 * `emailVerified`/`initialDismissed` are resolved server-side (the caller
 * reads `getCurrentUser()` + the dismissal cookie via `next/headers`), so the
 * first paint already matches — no flash of the banner before it disappears.
 * The dismiss button then writes the same cookie client-side (same pattern
 * as `member-sidebar`'s collapse-state cookie) so it stays hidden across
 * navigations for the rest of the browsing session, without needing a
 * server round-trip just to persist a UI preference.
 */
export function EmailVerificationBanner({
  emailVerified,
  initialDismissed,
}: {
  emailVerified: boolean;
  initialDismissed: boolean;
}) {
  const [dismissed, setDismissed] = useState(initialDismissed);
  const [sendState, setSendState] = useState<SendState>('idle');

  if (emailVerified || dismissed) return null;

  function dismiss() {
    document.cookie = `${EMAIL_VERIFICATION_BANNER_DISMISSED_COOKIE}=1; path=/; max-age=${DISMISS_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    setDismissed(true);
  }

  async function resend() {
    setSendState('sending');
    try {
      await resendVerificationEmail();
      setSendState('sent');
    } catch {
      setSendState('error');
    }
  }

  return (
    <div
      role="status"
      className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm"
    >
      <p className="text-foreground">
        Please verify your email address to keep full access to your account.
        {sendState === 'sent' && (
          <span className="ml-2 text-muted-foreground">Verification email sent — check your inbox.</span>
        )}
        {sendState === 'error' && (
          <span className="ml-2 text-destructive">Couldn&apos;t send the email. Try again shortly.</span>
        )}
      </p>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={resend}
          disabled={sendState === 'sending' || sendState === 'sent'}
        >
          {sendState === 'sending' ? 'Sending…' : 'Resend email'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={dismiss} aria-label="Dismiss">
          Dismiss
        </Button>
      </div>
    </div>
  );
}
