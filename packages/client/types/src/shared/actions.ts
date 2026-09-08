/** Result shape for Next.js server actions, produced by `client-lib`'s `actionSuccess`/`actionError`. */
export interface ActionState<TData = unknown> {
  status: 'success' | 'error';
  message?: string;
  data: TData;
  fieldErrors?: Record<string, string | string[]>;
}
