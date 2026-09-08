import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Shown when a section failed to load for a reason that isn't "you're logged out" — a
 *  transient backend error, a timeout, etc. Distinct from EmptyState, which means "loaded
 *  fine, there's just nothing here." */
export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span
        aria-hidden
        className="mb-1 grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive"
      >
        <AlertTriangle className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
