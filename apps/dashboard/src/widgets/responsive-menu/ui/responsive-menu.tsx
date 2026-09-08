'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@workspace/client-ui-overlays';

export interface MenuAction {
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  variant?: 'default' | 'destructive';
  /** Renders a separator above this action. */
  separated?: boolean;
}

interface ResponsiveMenuProps {
  trigger: React.ReactElement;
  title: string;
  /** Optional subtitle shown above the actions (e.g. the signed-in email). */
  description?: string;
  /** Optional identity avatar rendered beside the title in both presentations. */
  avatar?: React.ReactNode;
  actions?: MenuAction[];
  /** Custom body rendered instead of / above the actions. */
  children?: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * One menu, two idiomatic presentations:
 *
 * - **Desktop (`lg+`)** → an anchored dropdown, with Base UI's roving focus and
 *   keyboard semantics.
 * - **Mobile** → a bottom sheet with a grab handle, because a header-anchored
 *   dropdown is a web pattern and reads wrong on a phone.
 *
 * Both branches are rendered and toggled with CSS rather than a media-query
 * hook — that keeps it SSR-safe (no hydration mismatch, no first-paint flash).
 * The action list is defined once and mapped into both.
 */
export function ResponsiveMenu({
  trigger,
  title,
  description,
  avatar,
  actions = [],
  children,
  align = 'end',
  className,
}: ResponsiveMenuProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={trigger} />
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="glass-strong pb-safe rounded-t-xl px-3 pt-2"
          >
            <div aria-hidden className="mx-auto mb-2 h-1 w-9 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-3 px-3">
              {avatar}
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-sm font-semibold text-foreground">{title}</SheetTitle>
                {description ? (
                  <SheetDescription className="truncate text-xs text-muted-foreground">
                    {description}
                  </SheetDescription>
                ) : (
                  <SheetDescription className="sr-only">{title}</SheetDescription>
                )}
              </div>
            </div>

            {children}

            {actions.length > 0 && (
              <ul className="flex flex-col gap-1 pb-1">
                {actions.map((action) => (
                  <li key={action.label}>
                    <button
                      type="button"
                      onClick={() => {
                        setSheetOpen(false);
                        action.onSelect?.();
                      }}
                      className={cn(
                        'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium',
                        'transition-colors duration-(--duration-fast) ease-out active:scale-[0.99]',
                        action.variant === 'destructive'
                          ? 'text-destructive active:bg-destructive/10'
                          : 'text-foreground active:bg-sidebar-accent/50',
                      )}
                    >
                      {action.icon && <action.icon className="size-5 shrink-0" />}
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: anchored dropdown */}
      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger render={trigger} />
          <DropdownMenuContent align={align} className={cn('w-56', className)}>
            {/* GroupLabel throws outside a Group and takes the popup down with it. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="flex items-center gap-2.5">
                  {avatar}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{title}</span>
                    {description && (
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {description}
                      </span>
                    )}
                  </span>
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            {children}

            {actions.length > 0 && <DropdownMenuSeparator />}
            {actions.map((action) => (
              <div key={action.label}>
                {action.separated && <DropdownMenuSeparator />}
                <DropdownMenuItem variant={action.variant} onClick={action.onSelect}>
                  {action.icon && <action.icon className="size-4" />}
                  {action.label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
