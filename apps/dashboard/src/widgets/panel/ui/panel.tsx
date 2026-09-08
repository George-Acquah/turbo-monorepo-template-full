import { cn } from '@workspace/client-ui-primitives';

interface PanelProps {
  title?: string;
  description?: string;
  /** Header-right slot — a "View all" link, a filter, etc. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Removes body padding for flush content like a table. */
  flush?: boolean;
}

/**
 * The standard content surface inside `<main>`. Sits one step up from the main
 * surface (`bg-surface-2`) so it reads as a distinct block without a border —
 * this is the core "detached, no hard edges" move of the design language.
 */
export function Panel({ title, description, action, children, className, flush }: PanelProps) {
  const hasHeader = Boolean(title || action);

  return (
    <section className={cn('glass rounded-xl', className)}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0 space-y-0.5">
            {title && (
              <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(flush ? 'p-2' : 'p-4', hasHeader && !flush && 'pt-3')}>{children}</div>
    </section>
  );
}
