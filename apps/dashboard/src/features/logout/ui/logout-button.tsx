'use client';

import { LogOut } from 'lucide-react';
import { logout } from '../api/logout';

/** Renders a form so the logout server action runs on click. */
export function LogoutButton({ children }: { children?: React.ReactNode }) {
  return (
    <form action={logout} className="w-full">
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive transition-colors duration-(--duration-fast) ease-out active:scale-[0.99] active:bg-destructive/10"
      >
        <LogOut className="size-4" />
        {children ?? 'Sign out'}
      </button>
    </form>
  );
}
