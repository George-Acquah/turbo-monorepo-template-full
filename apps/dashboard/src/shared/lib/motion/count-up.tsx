'use client';

import { useEffect, useState } from 'react';
import { animate } from 'animejs';

interface CountUpProps {
  value: number;
  /** ms. @default 900 */
  duration?: number;
  /**
   * Appended after the rounded, locale-formatted number, e.g. `suffix="%"` → "68%".
   * A plain string, not a formatter function — this is a Client Component, often
   * rendered from a Server Component parent, and functions can't cross that boundary.
   */
  suffix?: string;
  className?: string;
}

/**
 * Animates a number from 0 → `value` on mount (anime.js). Honours `prefers-reduced-motion`
 * (jumps straight to the final value). For KPI/stat figures on the members app.
 */
export function CountUp({ value, duration = 900, suffix, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const state = { n: 0 };
    const animation = animate(state, {
      n: value,
      duration,
      ease: 'out(3)',
      onUpdate: () => setDisplay(state.n),
    });
    return () => {
      animation.pause();
    };
  }, [value, duration]);

  const rounded = Math.round(display);
  const formatted = rounded.toLocaleString('en-GB');
  return <span className={className}>{suffix ? `${formatted}${suffix}` : formatted}</span>;
}
