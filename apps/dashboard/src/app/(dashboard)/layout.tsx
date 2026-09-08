import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MemberShell } from '@/widgets/member-shell';
import { SIDEBAR_COOKIE } from '@/widgets/member-sidebar';
import { RealtimeProvider } from '@/app/providers/realtime-provider';
import { getAccount } from '@/shared/api';

/**
 * Layout for every authenticated screen. Route groups don't affect URLs, so
 * `(dashboard)/programmes` is still `/programmes`.
 *
 * The sidebar collapse state is read from the cookie here, on the server, so
 * the first paint already has the correct width — no expand/collapse flash.
 *
 * First-run gate: a claimed member who hasn't been through `/welcome`
 * (`onboardedAt` unset) is redirected there. `getAccount()` returns null on
 * any transient failure, so we never bounce on a hiccup — only on a real,
 * un-onboarded profile. `/welcome` lives in the `(onboarding)` group,
 * outside this layout, so there's no redirect loop.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const account = await getAccount();
  if (account?.userId && !account.onboardedAt) {
    redirect('/welcome');
  }

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === 'collapsed';

  return (
    <RealtimeProvider>
      <MemberShell defaultCollapsed={defaultCollapsed}>{children}</MemberShell>
    </RealtimeProvider>
  );
}
