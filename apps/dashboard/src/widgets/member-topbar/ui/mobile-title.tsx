'use client';

import { usePathname } from 'next/navigation';
import { memberNav } from '@/shared/config/navigation';

/**
 * The current section's name, shown in the mobile app header the way a native
 * app titles its screen. Hidden from `lg` up, where the sidebar already makes
 * location obvious.
 */
export function MobileTitle() {
  const pathname = usePathname();

  const match =
    memberNav.find((item) => item.href !== '/' && pathname.startsWith(item.href)) ??
    memberNav.find((item) => item.href === '/' && pathname === '/');

  return (
    <h1 className="truncate font-heading text-base font-semibold text-foreground lg:hidden">
      {match?.label ?? 'Workspace'}
    </h1>
  );
}
