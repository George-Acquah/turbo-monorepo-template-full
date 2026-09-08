import { VerifyEmailStatus } from '@/features/verify-email';
import { AuthShell } from '@/widgets/auth-shell';

export function VerifyEmailPage({ token }: { token: string }) {
  return (
    <AuthShell title="Verify your email" subtitle="Confirming your email verification link.">
      <VerifyEmailStatus token={token} />
    </AuthShell>
  );
}
