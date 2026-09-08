'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';

import { cn } from '../utils/cn';
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react';

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root>;

function asSelectValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asSelectKey(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

type SelectResolvedItem = {
  value: unknown;
  label: React.ReactNode;
};

const SelectItemLabelContext = React.createContext<Map<string, React.ReactNode> | null>(null);

function normalizeItemsInput(items: SelectProps['items']): SelectResolvedItem[] | undefined {
  if (!items) return undefined;

  if (Array.isArray(items)) {
    const normalized: SelectResolvedItem[] = [];

    for (const item of items) {
      if (item && typeof item === 'object' && 'items' in item && Array.isArray(item.items)) {
        for (const nestedItem of item.items as ReadonlyArray<unknown>) {
          if (
            nestedItem &&
            typeof nestedItem === 'object' &&
            'value' in nestedItem &&
            'label' in nestedItem
          ) {
            normalized.push({
              value: (nestedItem as { value: unknown }).value,
              label: (nestedItem as { label: React.ReactNode }).label,
            });
          }
        }
        continue;
      }

      if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
        normalized.push({
          value: (item as { value: unknown }).value,
          label: (item as { label: React.ReactNode }).label,
        });
      }
    }

    return normalized.length > 0 ? normalized : undefined;
  }

  return Object.entries(items).map(([value, label]) => ({ value, label }));
}

function collectSelectItems(children: React.ReactNode, items: SelectResolvedItem[]) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const childProps = child.props as {
      value?: unknown;
      label?: string;
      children?: React.ReactNode;
    };

    if (child.type === SelectItem) {
      if (childProps.value !== undefined) {
        items.push({
          value: childProps.value,
          label: childProps.label ?? childProps.children,
        });
      }
      return;
    }

    if (childProps.children) {
      collectSelectItems(childProps.children, items);
    }
  });
}

function Select({ defaultValue, value, onValueChange, items, children, ...props }: SelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string>(() =>
    asSelectValue(defaultValue),
  );

  const selectedValue = isControlled ? asSelectValue(value) : internalValue;
  const resolvedItems = React.useMemo<SelectResolvedItem[] | undefined>(() => {
    if (items !== undefined) return normalizeItemsInput(items);

    const derivedItems: SelectResolvedItem[] = [];
    collectSelectItems(children, derivedItems);
    return derivedItems.length > 0 ? derivedItems : undefined;
  }, [children, items]);

  const itemLabelMap = React.useMemo(() => {
    if (!resolvedItems || resolvedItems.length === 0) return null;

    const map = new Map<string, React.ReactNode>();
    for (const item of resolvedItems) {
      const key = asSelectKey(item.value);
      if (!key) continue;
      map.set(key, item.label);
    }
    return map.size > 0 ? map : null;
  }, [resolvedItems]);

  return (
    <SelectItemLabelContext.Provider value={itemLabelMap}>
      <SelectPrimitive.Root
        value={selectedValue as never}
        items={resolvedItems as SelectProps['items']}
        onValueChange={(next, eventDetails) => {
          if (!isControlled) setInternalValue(asSelectValue(next));
          onValueChange?.(next, eventDetails);
        }}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectItemLabelContext.Provider>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('scroll-my-1 p-1', className)}
      {...props}
    />
  );
}

function SelectValue({ className, children, placeholder, ...props }: SelectPrimitive.Value.Props) {
  const itemLabelMap = React.useContext(SelectItemLabelContext);

  if (children !== undefined) {
    return (
      <SelectPrimitive.Value
        data-slot="select-value"
        className={cn('flex flex-1 text-left', className)}
        placeholder={placeholder}
        {...props}
      >
        {children}
      </SelectPrimitive.Value>
    );
  }

  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn('flex flex-1 text-left', className)}
      placeholder={placeholder}
      {...props}
    >
      {(selectedValue: unknown) => {
        const key = asSelectKey(selectedValue);
        if (key && itemLabelMap?.has(key)) {
          return itemLabelMap.get(key);
        }
        if (!key) {
          return placeholder ?? '';
        }
        return key;
      }}
    </SelectPrimitive.Value>
  );
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-xl border border-input bg-transparent py-2 pr-3 pl-3 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-10 data-[size=sm]:h-8 data-[size=sm]:rounded-lg *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />}
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            'relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-elevation-2 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
