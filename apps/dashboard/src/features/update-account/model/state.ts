export type AccountFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message?: string; fieldErrors?: Record<string, string[]> };

export const initialAccountState: AccountFormState = { status: 'idle' };
