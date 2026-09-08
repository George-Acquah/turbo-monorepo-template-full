'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@workspace/client-ui-primitives';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@workspace/client-ui-overlays';
import type { NavItem } from '@/shared/config/navigation';
import { Link } from '@/shared/lib/transition-link';

/**
 * Bottom sheet holding the nav items that don't fit the tab bar — the standard
 * iOS/Android "More" tab. Slides up from the bottom with a grab handle, which
 * is what makes it read as an app sheet rather than a web dropdown.
 */
export function MobileMoreSheet({
  items,
  trigger,
}: {
  items: NavItem[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger as React.ReactElement} />
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="glass-strong pb-safe rounded-t-xl px-3 pt-2"
      >
        {/* Grab handle — the affordance that signals "drag to dismiss". */}
        <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
        <SheetTitle className="sr-only">More</SheetTitle>
        <SheetDescription className="sr-only">Additional sections</SheetDescription>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                    'transition-colors duration-(--duration-fast) ease-out active:scale-[0.99]',
                    isActive
                      ? 'bg-sidebar-accent text-foreground'
                      : 'text-muted-foreground active:bg-sidebar-accent/50',
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
