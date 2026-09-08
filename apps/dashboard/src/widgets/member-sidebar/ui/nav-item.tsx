'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@workspace/client-ui-primitives';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/client-ui-overlays';
import type { NavItem as NavItemConfig } from '@/shared/config/navigation';
import { Link } from '@/shared/lib/transition-link';

interface NavItemProps {
  item: NavItemConfig;
  /** Icon-rail mode — label is hidden and surfaced via tooltip instead. */
  collapsed?: boolean;
  /** Called after navigating — lets the mobile drawer close itself. */
  onNavigate?: () => void;
}

/**
 * Client only because active state depends on `usePathname`. Kept as its own
 * leaf so the sidebar shell around it stays a server component.
 */
export function NavItem({ item, collapsed = false, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        // min-h-11 keeps the touch target >= 44px on mobile.
        'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
        'transition-colors duration-(--duration-fast) ease-out',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
      )}
    >
      {/* Active marker: a soft inset bar rather than a hard border. */}
      <span
        aria-hidden
        className={cn(
          'absolute left-0 h-5 w-0.5 rounded-full bg-primary transition-opacity',
          'duration-(--duration-fast)',
          isActive ? 'opacity-100' : 'opacity-0',
          collapsed && 'left-1',
        )}
      />
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      {/* The trigger renders the anchor itself. Note: don't pass `nativeButton`
          here — TooltipTrigger accepts it in its types but doesn't consume it,
          so it leaks through to the DOM as an unknown attribute. */}
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
