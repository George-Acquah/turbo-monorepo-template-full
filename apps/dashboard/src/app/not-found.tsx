import Link from 'next/link';
import { Compass } from 'lucide-react';
import { buttonVariants, cn } from '@workspace/client-ui-primitives';

/**
 * Root 404 — for URLs that don't match any route (and any `notFound()` thrown
 * outside the dashboard shell). The in-shell version lives at
 * `(dashboard)/not-found.tsx`.
 */
export default function NotFound() {
  return (
    <div className="ambient-canvas flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"
      >
        <Compass className="size-5" />
      </span>
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          That link doesn&apos;t lead anywhere in your member area.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
        Back to your desk
      </Link>
    </div>
  );
}
