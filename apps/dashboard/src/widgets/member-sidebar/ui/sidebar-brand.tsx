import { cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';

/** Wordmark / logo lockup. Collapses to the monogram in icon-rail mode. */
export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex min-h-11 items-center gap-2.5 rounded-lg px-3',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        collapsed && 'justify-center px-0',
      )}
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground"
      >
        S
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-heading text-sm font-semibold tracking-tight text-foreground">
            Workspace
          </span>
          <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Members
          </span>
        </span>
      )}
      <span className="sr-only">Workspace Members — go to dashboard</span>
    </Link>
  );
}
