'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button, buttonVariants, cn } from '@workspace/client-ui-primitives';
import { EmptyState } from '@/widgets/empty-state';
import { Panel } from '@/widgets/panel';

/**
 * Catches any page-level failure across every dashboard route. Deliberately generic —
 * server-thrown errors are sanitized before reaching a client error boundary in
 * production (no reliable `error.status`/`instanceof ApiError` here), so this always
 * offers both recovery paths instead of trying to guess what went wrong: retry in place,
 * or go sign in again in case the session expired. Mirrors apps/backoffice's dashboard
 * error boundary — this app had none, so an uncaught server-action error (e.g.
 * `registerForEvent`'s `unwrap()` rejecting) used to take down the whole page instead of
 * being caught here.
 */
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Panel className="max-w-md">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description="This page hit an unexpected error. You can try again, or sign in again if your session expired."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Try again
              </Button>
              <Link href="/login" className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}>
                Sign in
              </Link>
            </div>
          }
        />
      </Panel>
    </div>
  );
}
