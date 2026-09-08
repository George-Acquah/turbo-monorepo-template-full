'use client';

import { cn } from '@workspace/client-ui-primitives';
import { useSidebar } from '../model/sidebar-state';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from '../config/sidebar.config';
import { SidebarBrand } from './sidebar-brand';
import { SidebarNav } from './sidebar-nav';
import { SidebarToggle } from './sidebar-toggle';

/**
 * Desktop sidebar — a detached, floating rounded panel (never a full-height
 * bordered column). Separation from the work area comes from the shell's gap
 * plus the `--sidebar` surface step, not a border.
 *
 * Client because it reads the collapse state. Deliberately small: brand, the
 * nav list, and a toggle — the heavy content areas stay server components.
 */
export function MemberSidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
      className={cn(
        'glass hidden shrink-0 flex-col gap-4 rounded-xl p-3 lg:flex',
        'text-sidebar-foreground',
        'transition-[width] duration-(--duration-base) ease-out',
      )}
    >
      <div className={cn('relative flex items-center', collapsed && 'justify-center')}>
        <SidebarBrand collapsed={collapsed} />
        <SidebarToggle />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>
    </aside>
  );
}
