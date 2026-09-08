'use client';
import { usePathname } from 'next/navigation';
import { User, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { label: 'Profile', href: '/account', icon: User },
  { label: 'Preferences', href: '/account/preferences', icon: SlidersHorizontal },
];

/**
 * Segmented tab strip shared by the account routes. Deliberately real links rather than
 * `Tabs` from primitives: these are separate routes, so they must be navigable, linkable, and
 * back-button-correct — a client-side tab panel would collapse both into one URL.
 */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account sections"
      className="glass inline-flex items-center gap-1 rounded-xl p-1"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
              'transition-colors duration-(--duration-fast) ease-out',
              active
                ? 'bg-surface-2 text-foreground shadow-elevation-1'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
