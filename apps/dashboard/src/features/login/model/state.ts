/** Result shape returned by the auth server actions to `useActionState`. */
export interface AuthFormState {
  status: 'idle' | 'error';
  message?: string;
  /** Per-field errors keyed by field name, from a failed zod parse. */
  fieldErrors?: Record<string, string[] | undefined>;
}

export const initialAuthState: AuthFormState = { status: 'idle' };
