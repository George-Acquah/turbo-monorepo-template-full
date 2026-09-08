import Link from 'next/link';
import { LoginForm } from '@/features/login';
import { AuthShell } from '@/widgets/auth-shell';

export function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Workspace account."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
