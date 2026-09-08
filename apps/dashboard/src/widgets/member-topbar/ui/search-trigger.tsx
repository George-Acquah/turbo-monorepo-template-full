'use client';

import { Search } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import { openCommandPalette } from '@/widgets/command-palette';

/**
 * Opens the command palette. Renders as a faux search field with the ⌘K hint on
 * desktop, and as a plain icon button (`compact`) in the mobile app header.
 */
export function SearchTrigger({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search"
        className={cn(
          'grid size-9 place-items-center rounded-lg text-muted-foreground',
          'transition-colors duration-(--duration-fast) ease-out active:scale-[0.97]',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        )}
      >
        <Search className="size-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search"
      aria-keyshortcuts="Meta+K"
      className={cn(
        'group flex min-h-9 w-64 items-center gap-2 rounded-lg bg-surface-2/50 px-3 text-sm',
        'text-muted-foreground transition-colors duration-(--duration-fast)',
        'ease-out hover:bg-surface-2/80 hover:text-foreground',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        'md:w-72',
      )}
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 text-left">Search…</span>
      <kbd
        aria-hidden
        className="rounded border border-glass-border px-1.5 py-0.5 font-mono text-[10px]"
      >
        ⌘K
      </kbd>
    </button>
  );
}
