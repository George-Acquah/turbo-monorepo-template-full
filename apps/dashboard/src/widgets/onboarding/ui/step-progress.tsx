import { cn } from '@workspace/client-ui-primitives';

interface Props {
  /** 1-based index of the active step. */
  current: number;
  total: number;
  className?: string;
}

/** A row of connected dots — one per onboarding step. */
export function StepProgress({ current, total, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2', className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                'size-2 rounded-full transition-colors',
                done && 'bg-primary',
                active && 'bg-primary ring-4 ring-primary/20',
                !done && !active && 'bg-border',
              )}
            />
            {step < total && (
              <span
                className={cn('h-px w-6 transition-colors', done ? 'bg-primary' : 'bg-border')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
