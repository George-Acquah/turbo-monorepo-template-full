import { redirect } from 'next/navigation';
import { getAccount } from '@/shared/api';
import { WelcomeFlow, type WelcomeContext } from './welcome-flow';

/**
 * First-run onboarding. The `(dashboard)` layout redirects a claimed member
 * here while `account.onboardedAt` is unset; finishing (or skipping) stamps
 * it and returns them to `/`. If they somehow reach `/welcome` already
 * onboarded, bounce straight to the dashboard.
 *
 * TEMPLATE NOTE: this ships as a two-step flow (welcome + a couple of
 * questions). Fetch whatever context your onboarding needs here and pass it
 * through `WelcomeContext`.
 */
export async function WelcomePage() {
  const account = await getAccount();
  if (account?.onboardedAt) redirect('/');

  const ctx: WelcomeContext = {
    firstName: account?.firstName ?? '',
    experience: account?.experience ?? null,
    goal: account?.goal ?? null,
  };

  return (
    <div className="ambient-canvas flex min-h-dvh items-center justify-center bg-background p-4 sm:p-8">
      <WelcomeFlow ctx={ctx} />
    </div>
  );
}
