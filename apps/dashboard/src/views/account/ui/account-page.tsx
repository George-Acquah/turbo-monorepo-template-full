import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { GraduationCap, KeyRound, ArrowRight } from 'lucide-react';
import { unwrap, ApiError } from '@workspace/client-api';
import { cn, Skeleton } from '@workspace/client-ui-primitives';
import { getAccountOrThrow, getServerApiClient } from '@/shared/api';
import { Link } from '@/shared/lib/transition-link';
import { Panel } from '@/widgets/panel';
import { AccountForm } from '@/features/update-account';
import { ProfileHero } from '@/widgets/profile-hero';
import { PanelSkeleton } from '@/widgets/page-skeleton';
import { ErrorState } from '@/widgets/error-state';
import { Reveal } from '@/shared/lib/motion';

/**
 * Profile tab. The page header and section tabs live in the route layout
 * (`app/(dashboard)/account/layout.tsx`) so they persist across both account routes.
 */
export function AccountPage() {
  return (
    <Reveal className="space-y-6">
      <Suspense fallback={<ProfileSectionSkeleton />}>
        <ProfileSection />
      </Suspense>
    </Reveal>
  );
}

async function ProfileSection() {
  let account;
  try {
    account = await getAccountOrThrow();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    return (
      <ErrorState
        title="Couldn't load your account"
        description="Something went wrong on our end. Please try again in a moment."
      />
    );
  }

  return (
    <>
      <ProfileHero account={account} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Personal details" description="Used on certificates and your community profile.">
          <AccountForm account={account} />
        </Panel>

        <Suspense fallback={<PanelSkeleton rows={2} />}>
          <MembershipSummary />
        </Suspense>
      </div>
    </>
  );
}

function ProfileSectionSkeleton() {
  return (
    <>
      <div className="glass flex items-center gap-4 rounded-xl p-4">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={2} />
      </div>
    </>
  );
}

/**
 * Live counts rather than a static "you're a member" panel — gives the column a reason to exist
 * beside the form, and both figures link to where they can actually be acted on.
 */
async function MembershipSummary() {
  const client = await getServerApiClient();
  const [{ data: grants }, { data: enrolments }] = await Promise.all([
    client.GET('/api/v1/access/me').then(unwrap),
    client.GET('/api/v1/enrolments').then(unwrap),
  ]);

  const rows = [
    {
      label: 'Active programmes',
      value: enrolments.filter((e) => e.status === 'ACTIVE').length,
      href: '/enrolments',
      icon: GraduationCap,
    },
    {
      label: 'Active access',
      value: grants.filter((g) => g.status === 'ACTIVE').length,
      href: '/access',
      icon: KeyRound,
    },
  ];

  return (
    <Panel title="Membership">
      <div className="space-y-2">
        {rows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className={cn(
              'group flex items-center gap-3 rounded-lg bg-surface-2/40 px-3 py-3',
              'transition-colors hover:bg-surface-2/70',
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
              <row.icon className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted-foreground">{row.label}</span>
              <span className="block font-mono text-xl font-semibold tabular-nums text-foreground">
                {row.value}
              </span>
            </span>
            <ArrowRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </Link>
        ))}
      </div>
    </Panel>
  );
}
