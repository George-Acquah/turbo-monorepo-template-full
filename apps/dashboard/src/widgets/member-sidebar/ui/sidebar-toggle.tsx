'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, cn } from '@workspace/client-ui-primitives';
import { useSidebar } from '../model/sidebar-state';

/**
 * Floating edge-handle that collapses the sidebar to an icon rail — straddles the
 * sidebar's right border, vertically centered on the brand row above it. Must be a
 * `relative` sibling of the brand row (see member-sidebar.tsx); `-right-3` cancels the
 * aside's own `p-3` so `right-0` lands at the sidebar's true outer edge, and
 * `translate-x-1/2` floats it half on/half off that edge.
 */
export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar();
  const Icon = collapsed ? ChevronRight : ChevronLeft;
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={toggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-pressed={collapsed}
      className={cn(
        'absolute -right-3 top-1/2 size-6 -translate-y-1/2 translate-x-1/2 rounded-full',
        'border border-glass-border bg-surface shadow-elevation-1 hover:bg-surface-2',
      )}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
