import type { ElementType, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Centered, max-width page gutter. */
export function Container({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn('mx-auto w-full max-w-5xl px-5 sm:px-8', className)}>{children}</Tag>;
}
