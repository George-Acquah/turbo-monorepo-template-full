'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '../utils/cn';

type SwitchProps = SwitchPrimitive.Root.Props;

/**
 * Binary on/off for a setting that applies immediately (no Save button) — that's the whole
 * distinction from `Checkbox`, which belongs in forms that get submitted. Same
 * `checked`/`defaultChecked` handling as Checkbox so controlled and uncontrolled callers
 * behave identically across both.
 */
function Switch({ className, defaultChecked, checked, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent',
        'bg-input transition-colors outline-none',
        'focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50',
        'data-checked:bg-primary dark:bg-input/50',
        className,
      )}
      checked={checked}
      defaultChecked={checked === undefined ? (defaultChecked ?? false) : undefined}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-4 translate-x-0.5 rounded-full bg-background shadow-elevation-1',
          'transition-transform data-checked:translate-x-[1.125rem]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
