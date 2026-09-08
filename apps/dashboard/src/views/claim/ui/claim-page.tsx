import { ClaimAccountForm } from '@/features/claim-account';
import { AuthShell } from '@/widgets/auth-shell';

export function ClaimPage({ token }: { token: string }) {
  return (
    <AuthShell
      title="Set up your account"
      subtitle="Choose a password to finish activating your account."
    >
      <ClaimAccountForm token={token} />
    </AuthShell>
  );
}
