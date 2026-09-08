import { cookies } from 'next/headers';
import { getCurrentUser, displayName } from '@/shared/api';
import { THEME_COOKIE } from '@/shared/lib/cookie-names';
import { parseThemePreference } from '@/shared/lib/theme';
import { NotificationsMenu } from '@/widgets/notifications-menu';
import { SearchTrigger } from './search-trigger';
import { UserMenu } from './user-menu';
import { MobileTitle } from './mobile-title';

/**
 * Floating, frosted topbar — a detached rounded panel, not a full-bleed
 * bordered header.
 *
 * On mobile it behaves like a native app header: the current section's title on
 * the left, actions on the right. Navigation is deliberately NOT here — it
 * lives in the bottom tab bar, which is where a thumb can actually reach it.
 *
 * Server component; resolves the user once and only the interactive leaves
 * cross into the client.
 */
export async function MemberTopbar() {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const identity = user
    ? { ...displayName(user), email: user.email ?? '' }
    : { name: 'Member', email: '', initials: 'M' };
  // Resolved server-side so the menu's initial state matches what the anti-flash script in
  // app/layout.tsx already put on <html> — otherwise the first client render disagrees.
  const initialTheme = parseThemePreference(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <header className="glass-strong flex h-14 shrink-0 items-center gap-2 rounded-xl px-3">
      {/* Mobile: app-style section title. Desktop: the search field takes over. */}
      <MobileTitle />
      <div className="hidden lg:block">
        <SearchTrigger />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="lg:hidden">
          <SearchTrigger compact />
        </div>
        <NotificationsMenu />
        <UserMenu
          name={identity.name}
          email={identity.email}
          initials={identity.initials}
          initialTheme={initialTheme}
        />
      </div>
    </header>
  );
}
