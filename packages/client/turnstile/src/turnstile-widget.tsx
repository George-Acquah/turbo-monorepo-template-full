'use client';

import { useEffect, useRef, useState } from 'react';

// Cloudflare Turnstile widget
// Docs: https://developers.cloudflare.com/turnstile/get-started/
//
// The token this produces must be verified server-side before any protected
// action is taken — never trust the client's own "verified" UI state alone.

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'normal' | 'compact';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetProps {
  /** Per-app/per-domain Cloudflare Turnstile site key (NEXT_PUBLIC_TURNSTILE_SITE_KEY). */
  siteKey: string;
  onVerified: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  /** Shown when `siteKey` is empty/unset. Defaults to a generic message. */
  unconfiguredMessage?: string;
}

export function TurnstileWidget({
  siteKey,
  onVerified,
  onExpired,
  onError,
  unconfiguredMessage = 'Security check unavailable — please try again later.',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'verified' | 'expired' | 'error' | 'unconfigured'>(
    'idle',
  );

  // Callers typically pass inline arrow functions that get a new identity on
  // every render. Keeping those directly in the effect's deps below would
  // tear down and re-render the widget on every parent re-render — including
  // ones triggered by this widget's own onError callback, which would cause
  // an infinite remount loop the moment Turnstile errors (each remount
  // immediately erroring again, re-triggering onError, ad infinitum). Refs
  // let the effect always call the latest callback without needing them in
  // the dependency array, so setup only runs once per mount.
  const onVerifiedRef = useRef(onVerified);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
    onExpiredRef.current = onExpired;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!siteKey) {
      console.error('Turnstile site key not set — widget skipped');
      setStatus('unconfigured');
      onErrorRef.current?.();
      return;
    }

    // Load Turnstile script if not already loaded
    const scriptId = 'cf-turnstile-script';
    const render = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        size: 'normal',
        callback: (token) => {
          setStatus('verified');
          onVerifiedRef.current(token);
        },
        'expired-callback': () => {
          setStatus('expired');
          onExpiredRef.current?.();
        },
        'error-callback': () => {
          setStatus('error');
          onErrorRef.current?.();
        },
      });
    };

    if (document.getElementById(scriptId)) {
      // Script already loaded
      if (window.turnstile) render();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // Intentionally mount-once: see the callback refs above.
  }, [siteKey]);

  return (
    <div className="flex flex-col gap-2">
      {/* The widget renders inside this div */}
      <div ref={containerRef} />

      {/* Status feedback */}
      {status === 'verified' && (
        <p className="text-[10px] text-emerald-400 flex items-center gap-1.5">
          <svg className="w-3 h-3 flex-none" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Security check passed
        </p>
      )}
      {status === 'expired' && (
        <p className="text-[10px] text-amber-400">Security check expired — please verify again.</p>
      )}
      {status === 'error' && (
        <p className="text-[10px] text-red-400">Security check failed — try refreshing the page.</p>
      )}
      {status === 'unconfigured' && <p className="text-[10px] text-red-400">{unconfiguredMessage}</p>}
    </div>
  );
}
