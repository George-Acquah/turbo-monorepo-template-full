'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Command as CommandIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    data-slot="command"
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground',
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children?: React.ReactNode;

  /**
   * Controlled selection for the underlying cmdk instance.
   * This allows consumers to synchronize the highlighted
   * CommandItem with an external preview pane.
   */
  commandValue?: string;
  onCommandValueChange?: (value: string) => void;
}

const CommandDialog = ({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  commandValue,
  onCommandValueChange,
  ...props
}: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          // Layout
          'flex flex-col',
          'h-[calc(100vh-2rem)] max-h-[720px]',

          // Appearance
          'top-1/2 translate-y-[-50%] overflow-hidden rounded-2xl p-0',
          'border border-border/40 bg-surface backdrop-blur-xl',
          'shadow-[0_16px_70px_-10px_rgba(0,0,0,0.3)] duration-200',

          // Width
          'max-w-[calc(100vw-2rem)] sm:max-w-[720px] md:max-w-[820px] lg:max-w-[920px]',

          // Allow consumer overrides
          className,
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="shrink-0 px-4 pt-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Command
          className="min-h-0 flex-1 bg-transparent p-0"
          value={commandValue}
          onValueChange={onCommandValueChange}
        >
          {children}
        </Command>

        {/* Persistent Premium Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/30 bg-muted/20 px-4 py-2.5 text-[11px] font-medium text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="flex h-5 items-center justify-center rounded border border-border/60 bg-muted px-1.5 font-sans font-semibold text-foreground shadow-sm">
                ↑↓
              </kbd>
              Navigate
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="flex h-5 items-center justify-center rounded border border-border/60 bg-muted px-1.5 font-sans font-semibold text-foreground shadow-sm">
                ↵
              </kbd>
              Open
            </span>
          </div>

          <span className="flex items-center gap-1.5">
            <kbd className="flex h-5 items-center justify-center rounded border border-border/60 bg-muted px-1.5 font-sans font-semibold text-foreground shadow-sm">
              Esc
            </kbd>
            Dismiss
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    data-slot="command-input"
    className={cn(
      'flex h-10 w-full rounded-xl bg-background px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/60',
      className,
    )}
    {...props}
  />
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    data-slot="command-list"
    className={cn('min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2 outline-none', className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    data-slot="command-empty"
    className={cn(
      'flex flex-col items-center justify-center py-14 text-center sm:py-20',
      className,
    )}
    {...props}
  >
    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/50">
      <CommandIcon className="size-6 text-muted-foreground/50" />
    </div>
    <p className="text-[15px] font-medium text-foreground">No results found</p>
    <p className="mt-1 text-sm text-muted-foreground">Try tweaking your search terms.</p>
  </CommandPrimitive.Empty>
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    data-slot="command-group"
    className={cn(
      'overflow-hidden px-1 py-1.5 text-foreground',
      '[&[cmdk-group-heading]]:px-3 [&[cmdk-group-heading]]:py-2 [&[cmdk-group-heading]]:text-[11px] [&[cmdk-group-heading]]:font-semibold [&[cmdk-group-heading]]:uppercase [&[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/70',
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    data-slot="command-separator"
    className={cn('-mx-2 my-1 h-px bg-border/40', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    data-slot="command-item"
    className={cn(
      'group/command-item relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-100 ease-in-out',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[selected=true]:shadow-sm',
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
      '[&_svg]:text-muted-foreground data-[selected=true]:[&_svg]:text-accent-foreground',
      className,
    )}
    {...props}
  >
    {children}
  </CommandPrimitive.Item>
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="command-shortcut"
      className={cn(
        'ml-auto flex items-center text-[10px] tracking-widest text-muted-foreground opacity-0 transition-opacity duration-200',
        'group-data-[selected=true]/command-item:opacity-100',
        className,
      )}
      {...props}
    />
  ),
);
CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
