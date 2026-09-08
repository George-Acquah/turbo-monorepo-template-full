import { ArrowLeft } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  className?: string;
  /** Renders a "← {backLabel}" link above the title — detail pages that have no other way
   * back to their list. */
  backHref?: string;
  /** @default 'Back' */
  backLabel?: string;
}

/** Standard screen header. Every page starts with one so titling stays consistent. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  backHref,
  backLabel = 'Back',
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}
    >
      <div className="min-w-0 space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </Link>
        )}
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && <p className="max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
