import { cn } from '../utils/cn';

/**
 * Handles plain strings, string arrays, and Zod `.format()` shape `{ _errors: string[] }`.
 */
export function FieldError({
  errors,
  field,
  className,
}: {
  errors?: Record<string, unknown>;
  field: string;
  className?: string;
}) {
  const err = errors?.[field];
  if (!err) return null;
  const message =
    typeof err === 'string'
      ? err
      : Array.isArray(err)
        ? err[0]
        : typeof err === 'object' && err !== null && '_errors' in err
          ? (err as { _errors: string[] })._errors[0]
          : undefined;
  if (!message) return null;
  return <p className={cn('text-xs text-destructive', className)}>{message}</p>;
}
