import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Mail, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { formatDate } from '@workspace/client-lib/utils';
import { ApiError } from '@workspace/client-api';
import { getAccountOrThrow, getMyPreferences } from '@/shared/api';
import { Panel } from '@/widgets/panel';
import { ThemePicker } from '@/features/set-theme';
import { MarketingConsentToggle } from '@/widgets/consents-panel';
import { NotificationPreferencesPanel } from '@/widgets/notification-preferences-panel';
import { PanelSkeleton } from '@/widgets/page-skeleton';
import { ErrorState } from '@/widgets/error-state';
import { Reveal } from '@/shared/lib/motion';

/**
 * Preferences tab. Header and section tabs come from the route layout.
 *
 * Notification preferences were previously absent here on purpose — `modules/notifications` had
 * no HTTP surface, and a panel of switches that silently discarded their state would have been
 * worse than not offering it. That's no longer true (`/v1/notification-preferences` is real),
 * so the panel is real too now.
 */
export function AccountPreferencesPage() {
  return (
    <Reveal className="space-y-6">
      <Suspense fallback={<PreferencesSectionSkeleton />}>
        <PreferencesSection />
      </Suspense>
    </Reveal>
  );
}

async function PreferencesSection() {
  let account, preferences;
  try {
    [account, preferences] = await Promise.all([getAccountOrThrow(), getMyPreferences()]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    return (
      <Panel>
        <ErrorState
          title="Couldn't load your preferences"
          description="Something went wrong on our end. Please try again in a moment."
        />
      </Panel>
    );
  }

  return (
    <>
      <Panel title="Appearance" description="Follows you across devices.">
        <ThemePicker initial={preferences.theme} />
      </Panel>

      <Panel title="Notifications" description="Which categories reach you on which channels.">
        <Suspense fallback={<PanelSkeleton rows={4} />}>
          <NotificationPreferencesPanel />
        </Suspense>
      </Panel>

      <Panel title="Communication" description="What we're allowed to send you.">
        <div className="space-y-2">
          <SettingRow
            icon={Mail}
            title="Marketing email"
            description="Occasional updates about programmes, cohorts, and events. Never trading advice."
            control={<MarketingConsentToggle optedIn={account.marketingOptIn} />}
          />
        </div>
      </Panel>

      <Panel title="Account status">
        <div className="space-y-2">
          <SettingRow
            icon={ShieldCheck}
            title={account.userId ? 'Account verified' : 'Account unclaimed'}
            description={
              account.userId
                ? 'Your login is set up and your profile is linked to it.'
                : 'Finish setting up your login from the email we sent you.'
            }
            control={
              <span
                className={account.userId ? 'text-sm text-success' : 'text-sm text-warning'}
              >
                {account.userId ? 'Active' : 'Pending'}
              </span>
            }
          />
          <SettingRow
            icon={MonitorSmartphone}
            title="Member since"
            description="The date your profile was created."
            control={
              <span className="text-sm text-muted-foreground">
                {formatDate(String(account.createdAt))}
              </span>
            }
          />
        </div>
      </Panel>
    </>
  );
}

function PreferencesSectionSkeleton() {
  return (
    <>
      <PanelSkeleton rows={1} />
      <PanelSkeleton rows={4} />
      <PanelSkeleton rows={1} />
      <PanelSkeleton rows={2} />
    </>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  control,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface-2/40 px-3 py-3">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}
