'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { LogOut, Moon, Settings, Sun, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, Button } from '@workspace/client-ui-primitives';
import { logout } from '@/features/logout';
import { applyTheme, resolveTheme, type ThemePreference } from '@/shared/lib/theme';
import { ResponsiveMenu, type MenuAction } from '@/widgets/responsive-menu';

interface UserMenuProps {
  name: string;
  email: string;
  initials: string;
  /** Server-resolved from the theme cookie so the first paint already matches. */
  initialTheme: ThemePreference;
}

/**
 * Account menu — an anchored dropdown on desktop, a bottom sheet on mobile
 * (see `ResponsiveMenu`). Props come from the server so this leaf never fetches.
 * Sign out calls the `logout` server action, which revokes the session,
 * clears cookies, and redirects.
 */
export function UserMenu({ name, email, initials, initialTheme }: UserMenuProps) {
  const router = useRouter();
  const [, startLogout] = useTransition();
  const [preference, setPreference] = useState<ThemePreference>(initialTheme);

  // Quick flip between light and dark only. Picking `system` explicitly lives on the
  // preferences page — a three-way cycle behind one menu item is a guessing game about which
  // state comes next.
  const resolved = resolveTheme(preference);
  const toggleTheme = () => {
    const next: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setPreference(next);
  };

  const actions: MenuAction[] = [
    { label: 'Profile', icon: UserIcon, onSelect: () => router.push('/account') },
    { label: 'Preferences', icon: Settings, onSelect: () => router.push('/account/preferences') },
    {
      label: resolved === 'dark' ? 'Light mode' : 'Dark mode',
      icon: resolved === 'dark' ? Sun : Moon,
      onSelect: toggleTheme,
    },
    {
      label: 'Sign out',
      icon: LogOut,
      variant: 'destructive',
      separated: true,
      // Must be an async callback that actually `await`s the call — a sync callback
      // that fire-and-forgets the promise never lets React track it as part of the
      // transition, so Next can't reliably intercept the thrown `redirect()` signal or
      // apply the cookie-clearing response (page stays put, tokens stay stale).
      onSelect: () => startLogout(async () => { await logout(); }),
    },
  ];

  return (
    <ResponsiveMenu
      title={name}
      description={email}
      actions={actions}
      avatar={
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      }
      trigger={
        <Button
          variant="ghost"
          aria-label="Account menu"
          className="h-9 gap-2 rounded-full border border-glass-border bg-surface-2/50 px-1.5 pr-2.5 shadow-elevation-1 hover:border-ring/30 hover:bg-surface-2/80"
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {name.split(' ')[0]}
          </span>
        </Button>
      }
    />
  );
}
