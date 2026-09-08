import { PageHeader } from '@/widgets/page-header';
import { AccountNav } from '@/widgets/account-nav';

/**
 * Shared chrome for the account routes — the header and section tabs persist across
 * /account and /account/preferences, so switching between them never re-renders them.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="Your profile, appearance, and communication settings." />
      <AccountNav />
      {children}
    </div>
  );
}
