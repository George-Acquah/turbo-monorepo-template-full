import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Bell, User } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Primary navigation. Visibility should be driven by backend access state at
 * render time, not hardcoded here (see apps/dashboard/CLAUDE.md).
 *
 * TEMPLATE NOTE: ships with three example destinations. Add your product's
 * sections here; if a route needs a permission gate, resolve it server-side in
 * the view via `requirePermission()` (see `src/shared/lib/require-permission.ts`).
 */
export const primaryNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Account', href: '/account', icon: User },
];

/** @deprecated alias kept while call sites migrate to `primaryNav`. */
export const memberNav = primaryNav;
