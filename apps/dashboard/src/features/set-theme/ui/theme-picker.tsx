'use client';
import { useState, useTransition } from 'react';
import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import { applyTheme, type ThemePreference } from '@/shared/lib/theme';
import { updateThemePreference } from '../api/update-theme';

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon; hint: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, hint: 'Always light' },
  { value: 'dark', label: 'Dark', icon: Moon, hint: 'Always dark' },
  { value: 'system', label: 'System', icon: Monitor, hint: 'Match your device' },
];

/**
 * Three explicit choices rather than a toggle, because `system` isn't a third brightness — it's
 * "keep following the OS", which a two-state switch can't express.
 *
 * `applyTheme` flips the class and cookie instantly (no visible delay); `updateThemePreference`
 * persists to the account in the background so the choice follows the member across devices.
 * The two are deliberately decoupled — waiting on the round-trip before applying anything would
 * turn an instant toggle into a laggy one for no benefit the member would notice.
 */
export function ThemePicker({ initial }: { initial: ThemePreference }) {
  const [preference, setPreference] = useState<ThemePreference>(initial);
  const [, startTransition] = useTransition();

  const select = (value: ThemePreference) => {
    applyTheme(value);
    setPreference(value);
    startTransition(async () => {
      await updateThemePreference(value);
    });
  };

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              aria-pressed={active}
              className={cn(
                'group relative flex flex-col gap-3 rounded-xl border p-3 text-left',
                'transition-colors duration-(--duration-fast) ease-out outline-none',
                'focus-visible:ring-3 focus-visible:ring-ring/50',
                active
                  ? 'border-primary/50 bg-surface-2/60'
                  : 'border-glass-border bg-surface-2/20 hover:bg-surface-2/40',
              )}
            >
              <ThemeSwatch value={option.value} />
              <span className="flex items-center gap-2">
                <option.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
                {active && <Check aria-hidden className="size-4 shrink-0 text-primary" />}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * A miniature of the app shell. Uses `--preview-light-*`/`--preview-dark-*` from tokens.css —
 * fixed, non-theme-reactive tokens made for exactly this case, since the light swatch must look
 * light even while the app is dark (it can't inherit the active theme like every other token).
 */
function ThemeSwatch({ value }: { value: ThemePreference }) {
  if (value === 'system') {
    return (
      <span aria-hidden className="flex h-14 overflow-hidden rounded-lg border border-glass-border">
        <span className="flex-1 border-r border-glass-border bg-preview-light-bg p-1.5">
          <span className="block h-1.5 w-8 rounded-full bg-preview-light-bar-1" />
          <span className="mt-1 block h-1.5 w-5 rounded-full bg-preview-light-bar-2" />
        </span>
        <span className="flex-1 bg-preview-dark-bg p-1.5">
          <span className="block h-1.5 w-8 rounded-full bg-preview-dark-bar-1" />
          <span className="mt-1 block h-1.5 w-5 rounded-full bg-preview-dark-bar-2" />
        </span>
      </span>
    );
  }

  const light = value === 'light';
  return (
    <span
      aria-hidden
      className={cn(
        'block h-14 overflow-hidden rounded-lg border border-glass-border p-1.5',
        light ? 'bg-preview-light-bg' : 'bg-preview-dark-bg',
      )}
    >
      <span
        className={cn('block h-1.5 w-12 rounded-full', light ? 'bg-preview-light-bar-1' : 'bg-preview-dark-bar-1')}
      />
      <span
        className={cn(
          'mt-1 block h-1.5 w-8 rounded-full',
          light ? 'bg-preview-light-bar-2' : 'bg-preview-dark-bar-2',
        )}
      />
      <span
        className={cn(
          'mt-1 block h-1.5 w-10 rounded-full',
          light ? 'bg-preview-light-bar-3' : 'bg-preview-dark-bar-3',
        )}
      />
    </span>
  );
}
