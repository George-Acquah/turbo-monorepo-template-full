'use client';

import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import { memberNav } from '@/shared/config/navigation';
import { Link } from '@/shared/lib/transition-link';
import { MobileMoreSheet } from './mobile-more-sheet';

/** Native-app convention: 4 primary destinations + "More". Never more than 5 tabs. */
const PRIMARY_TAB_COUNT = 4;

/**
 * Bottom tab bar — the mobile-app navigation pattern. Thumb-reachable, always
 * visible, with the current tab indicated by both icon fill and label weight
 * (never colour alone). Sits above the home indicator via `pb-safe`.
 *
 * Hidden from `lg` up, where the sidebar takes over.
 */
export function MobileNavBar() {
  const pathname = usePathname();
  const tabs = memberNav.slice(0, PRIMARY_TAB_COUNT);
  const overflow = memberNav.slice(PRIMARY_TAB_COUNT);

  return (
    <nav
      aria-label="Primary"
      className="bg-popover pb-safe fixed inset-x-0 bottom-0 z-40 rounded-t-xl lg:hidden"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1">
        {tabs.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  // 56px tall keeps the tap target comfortably above the 44px floor.
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1',
                  'transition-colors duration-(--duration-fast) ease-out',
                  'active:scale-[0.97] active:bg-sidebar-accent/40',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('size-5 shrink-0', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] leading-none', isActive && 'font-semibold')}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}

        {overflow.length > 0 && (
          <li className="flex-1">
            <MobileMoreSheet
              items={overflow}
              trigger={
                <button
                  type="button"
                  aria-label="More"
                  className={cn(
                    'flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-1',
                    'text-muted-foreground transition-colors duration-(--duration-fast) ease-out',
                    'active:scale-[0.97] active:bg-sidebar-accent/40',
                  )}
                >
                  <MoreHorizontal className="size-5 shrink-0" />
                  <span className="text-[10px] leading-none">More</span>
                </button>
              }
            />
          </li>
        )}
      </ul>
    </nav>
  );
}
