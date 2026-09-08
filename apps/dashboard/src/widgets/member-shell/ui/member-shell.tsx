import { cookies } from 'next/headers';
import { getCurrentUser } from '@/shared/api';
import { EMAIL_VERIFICATION_BANNER_DISMISSED_COOKIE } from '@/shared/lib/cookie-names';
import { CommandPalette } from '@/widgets/command-palette';
import { EmailVerificationBanner } from '@/widgets/email-verification-banner';
import { MemberSidebar, SidebarProvider } from '@/widgets/member-sidebar';
import { MemberTopbar } from '@/widgets/member-topbar';
import { MobileNavBar } from '@/widgets/mobile-nav-bar';
import { NavigationProgressBar } from '@/shared/ui/navigation-progress-bar';

/**
 * The app shell — "detached rounded glass" layout.
 *
 * The canvas carries soft brand-coloured light (`ambient-canvas`); the sidebar,
 * topbar, and work area are frosted panels floating on it, separated by the
 * outer padding + gap. Nothing is full-bleed and nothing is divided by a hard
 * rule — separation is gap + translucency + a hairline edge light.
 *
 * Only `<main>` scrolls, so the shell never double-scrolls.
 *
 * Mobile behaves like a native app rather than a shrunken desktop: no sidebar,
 * a compact app header, and a thumb-reachable bottom tab bar. `<main>` gets
 * bottom padding so content clears that bar.
 *
 * Server component. `defaultCollapsed` comes from the cookie via the layout so
 * the first paint is already the correct width. Also resolves the current
 * user (`getCurrentUser()` — `cache()`d, so this doesn't add a second
 * network round-trip on top of `MemberTopbar`'s own call within the same
 * render) and the verification-banner dismissal cookie, so the reminder
 * banner's initial paint already matches server state — no flash.
 */
export async function MemberShell({
  defaultCollapsed,
  children,
}: {
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const emailVerified = user?.emailVerified ?? true; // no session yet — nothing to remind about
  const bannerDismissed = cookieStore.get(EMAIL_VERIFICATION_BANNER_DISMISSED_COOKIE)?.value === '1';

  return (
    <SidebarProvider defaultCollapsed={defaultCollapsed}>
      <NavigationProgressBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <div className="ambient-canvas flex h-dvh gap-2 bg-background p-2 lg:gap-3 lg:p-3">
        <MemberSidebar />

        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
          <MemberTopbar />
          <EmailVerificationBanner emailVerified={emailVerified} initialDismissed={bannerDismissed} />

          <main
            id="main-content"
            tabIndex={-1}
            className={
              'glass min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl p-4 outline-none ' +
              // Clears the fixed bottom tab bar on mobile only.
              'pb-24 lg:p-6 lg:pb-6'
            }
          >
            {children}
          </main>
        </div>
      </div>

      <MobileNavBar />
      <CommandPalette />
    </SidebarProvider>
  );
}
