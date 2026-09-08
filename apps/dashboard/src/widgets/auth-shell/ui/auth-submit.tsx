'use client';

import { Button } from '@workspace/client-ui-primitives';

/** Submit button that reflects the enclosing form's pending state. */
export function AuthSubmit({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <Button type="submit" size="sm" className="w-full" disabled={pending}>
      {pending ? 'Please wait…' : children}
    </Button>
  );
}
