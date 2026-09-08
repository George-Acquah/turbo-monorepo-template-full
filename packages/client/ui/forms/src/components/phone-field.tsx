'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { COUNTRY_DIAL_CODES, dialForIso, parsePhone } from '../data/country-dial-codes';

export interface PhoneFieldProps {
  /** Form field name — a hidden input carries the combined E.164 value. */
  name: string;
  id?: string;
  /** Stored value: `+233...`, `233...`, or a bare national number. */
  defaultValue?: string | null;
  /** ISO-3166-1 alpha-2 country to seed the dial code from (e.g. the profile's `country`). */
  defaultCountry?: string | null;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  className?: string;
  /** Called with the combined value (`''` when the national part is empty). */
  onChange?: (value: string) => void;
}

/**
 * A dial-code `<select>` beside a national-number `<input>`. A hidden input
 * named `name` holds the combined `+{dial}{digits}` value so it drops into a
 * plain `<form action={serverAction}>` with no extra wiring — the same shape
 * `AccountForm` already posts as `phone`.
 */
export function PhoneField({
  name,
  id,
  defaultValue,
  defaultCountry,
  disabled,
  required,
  error,
  className,
  onChange,
}: PhoneFieldProps) {
  const seed = React.useMemo(
    () => parsePhone(defaultValue, defaultCountry),
    [defaultValue, defaultCountry],
  );
  const [dial, setDial] = React.useState(seed.dial || dialForIso(defaultCountry));
  const [national, setNational] = React.useState(seed.national);

  const combined = national.trim() ? `+${dial}${national.replace(/[^\d]/g, '')}` : '';

  React.useEffect(() => {
    onChange?.(combined);
  }, [combined, onChange]);

  return (
    <div className={cn('flex gap-2', className)}>
      <input type="hidden" name={name} value={combined} />
      <select
        aria-label="Country calling code"
        value={dial}
        disabled={disabled}
        onChange={(e) => setDial(e.target.value)}
        className={cn(
          'h-10 shrink-0 rounded-lg border border-input bg-surface-2/40 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50',
          error && 'border-destructive',
        )}
      >
        {COUNTRY_DIAL_CODES.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.iso} +{c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="24 123 4567"
        disabled={disabled}
        required={required}
        value={national}
        onChange={(e) => setNational(e.target.value.replace(/[^\d\s-]/g, ''))}
        aria-invalid={error || undefined}
        className={cn(
          'h-10 w-full min-w-0 rounded-lg border border-input bg-surface-2/40 px-3 py-2 text-base outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground hover:border-ring/40 focus-visible:border-ring focus-visible:bg-transparent focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30',
        )}
      />
    </div>
  );
}
