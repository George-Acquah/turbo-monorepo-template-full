'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Per-child stagger in ms. @default 60 */
  delayStep?: number;
  /** Rise distance in px. @default 14 */
  y?: number;
}

/**
 * Staggered fade-and-rise for its direct children on mount (anime.js). Purely presentational
 * polish — always honours `prefers-reduced-motion` (skips entirely, leaving content visible).
 * Client leaf; wrap a grid/list of cards with it. Members app only (admin stays calm).
 */
export function Reveal({ children, className, delayStep = 60, y = 14 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = Array.from(el.children) as HTMLElement[];
    if (targets.length === 0) return;
    const animation = animate(targets, {
      opacity: [0, 1],
      translateY: [y, 0],
      duration: 520,
      delay: stagger(delayStep),
      ease: 'out(3)',
    });
    return () => {
      animation.pause();
    };
  }, [delayStep, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
