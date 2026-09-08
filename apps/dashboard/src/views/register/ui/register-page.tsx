import Link from 'next/link';
import { RegisterForm } from '@/features/register';
import { AuthShell } from '@/widgets/auth-shell';

export function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start learning with Workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
