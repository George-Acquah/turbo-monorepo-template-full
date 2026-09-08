import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { buttonVariants, cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  /** What this surface will do — written for a member, not a developer. */
  description: string;
  /** Concrete bullets so the page says something, rather than just "coming soon". */
  points?: string[];
  /** Where to send someone who arrived here and still needs to get something done. */
  backHref?: string;
  backLabel?: string;
}

/**
 * The honest state for a route whose backend genuinely doesn't exist yet (see
 * apps/members/README.md's "Backend gaps"). Deliberately not a fake dashboard with placeholder
 * data — showing invented numbers on a real member's screen is worse than showing nothing.
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  points,
  backHref = '/',
  backLabel = 'Back to dashboard',
}: ComingSoonProps) {
  return (
    <section className="glass-strong tile-spotlight mx-auto max-w-2xl rounded-2xl p-8 text-center shadow-elevation-3 sm:p-12">
      <span
        aria-hidden
        className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary"
      >
        <Icon className="size-7" />
      </span>

      <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>

      {points && points.length > 0 && (
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 rounded-lg bg-surface-2/40 px-3 py-2.5 text-sm text-foreground"
            >
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {point}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7">
        <Link href={backHref} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          {backLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
