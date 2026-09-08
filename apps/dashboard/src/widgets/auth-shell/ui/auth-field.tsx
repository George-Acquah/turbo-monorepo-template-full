import { Input, FieldError } from '@workspace/client-ui-forms';
import { Label } from '@workspace/client-ui-primitives';

/**
 * One labelled input + its inline error, wired to the field-name keyed error
 * map the auth server actions return. Kept as a shared piece so login /
 * register / claim forms stay identical in look and behaviour.
 */
export function AuthField({
  name,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  required,
  defaultValue,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  errors?: Record<string, unknown>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={Boolean(errors?.[name])}
      />
      <FieldError errors={errors} field={name} className="text-xs text-destructive" />
    </div>
  );
}
