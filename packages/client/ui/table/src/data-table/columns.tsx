'use client';

import * as React from 'react';
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/react-table';
import { ChevronDown, Loader2, MoreHorizontal } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  badgeVariants,
  Checkbox,
  buttonVariants,
} from '@workspace/client-ui-primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/client-ui-overlays';
import { cn } from '../utils/cn';

export const SELECTION_COLUMN_ID = 'select';
export const ACTIONS_COLUMN_ID = 'actions';

/** Auto-injected by `<DataTable enableRowSelection />` — don't add manually. */
export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: SELECTION_COLUMN_ID,
    header: ({ table }: HeaderContext<TData, unknown>) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(value)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }: CellContext<TData, unknown>) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
  };
}

export interface RowAction<TData> {
  label: string;
  onSelect: (row: TData) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: TData) => boolean;
  /** Shows a spinner and forces the item disabled while its request is in flight. */
  pending?: (row: TData) => boolean;
  /** Renders a separator above this action — group destructive actions apart. */
  separated?: boolean;
}

/** Auto-injected by `<DataTable actions={[...]} />` — don't add manually. */
export function createActionsColumn<TData>(actions: RowAction<TData>[]): ColumnDef<TData, unknown> {
  return {
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }: CellContext<TData, unknown>) => {
      // Any pending action keeps the menu closed (Base UI closes on select, so an
      // in-menu spinner would be unmounted instantly) — the always-visible trigger is
      // the only place a busy row can actually show feedback.
      const isRowPending = actions.some((action) => action.pending?.(row.original) ?? false);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-xs' }))}
            aria-label="Row actions"
            disabled={isRowPending}
          >
            {isRowPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => {
              const isPending = action.pending?.(row.original) ?? false;
              return (
                <React.Fragment key={action.label}>
                  {action.separated ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    variant={action.variant}
                    disabled={action.disabled?.(row.original) || isPending}
                    onClick={() => action.onSelect(row.original)}
                  >
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 48,
  };
}

// ============================================================================
// Cell renderers — pass as a column's `cell` to get consistent formatting.
// ============================================================================

const STATUS_TONE_CLASSNAME: Record<string, string> = {
  default: '',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  info: 'bg-info/15 text-info border-info/30',
};

export interface StatusChipProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

/** Status/lifecycle chip — e.g. a cohort's SCHEDULED/RUNNING/COMPLETED status. */
export function StatusChip({ label, tone = 'default' }: StatusChipProps) {
  return (
    <Badge variant="outline" className={cn('capitalize', STATUS_TONE_CLASSNAME[tone])}>
      {label.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}

export interface PersonCellProps {
  name: string;
  subtitle?: string;
  imageSrc?: string;
  initials?: string;
}

/** Avatar + name (+ optional subtitle, e.g. email) — the common "who" column. */
export function PersonCell({ name, subtitle, imageSrc, initials }: PersonCellProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar size="sm">
        {imageSrc ? <AvatarImage src={imageSrc} alt={name} /> : null}
        <AvatarFallback>{initials ?? name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{name}</div>
        {subtitle ? (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];
const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelative(date: Date): string {
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  if (Math.abs(diffSeconds) < 60) return relativeFormatter.format(0, 'second');
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return relativeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return relativeFormatter.format(0, 'second');
}

export interface DateTimeCellProps {
  /** ISO date/datetime string. */
  value: string;
  /** Suppresses the time portion of the absolute line for date-only values. */
  dateOnly?: boolean;
}

/** Table date/scheduled-at cell — bold absolute date+time on top ("24 Jun 2024, 2:30 pm"),
 * muted relative subtext below ("in 3 days"/"2 hours ago"). Absolute-first: this is an ops
 * screen where the exact time matters more than a social-feed-style relative-first read. */
export function DateTimeCell({ value, dateOnly = false }: DateTimeCellProps) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return <span className="text-sm text-muted-foreground">—</span>;

  const absolute = date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(dateOnly ? {} : { hour: 'numeric', minute: '2-digit' }),
  });

  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-xs tabular-nums text-foreground">{absolute}</p>
      <p className="truncate text-[11px] text-muted-foreground">{formatRelative(date)}</p>
    </div>
  );
}

export interface StatusSelectOption {
  value: string;
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

export interface StatusSelectProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  /** Valid next statuses for this row. Omitted/empty → renders as a plain, non-interactive
   * chip (a terminal status with nowhere left to transition to). */
  options?: StatusSelectOption[];
  /** True while a transition triggered from this cell is in flight. */
  pending?: boolean;
  onSelect?: (nextValue: string) => void;
}

const STATUS_DOT_CLASSNAME: Record<string, string> = {
  default: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
};

/** Colored status chip that's also a dropdown when `options` gives it somewhere to go —
 * changes status right from the table cell instead of only via a separate row action.
 * Rows in a terminal status (no `options`) render the same pill, just non-interactive. */
export function StatusSelect({ label, tone = 'default', options, pending, onSelect }: StatusSelectProps) {
  const chipClassName = cn(badgeVariants({ variant: 'outline' }), 'capitalize', STATUS_TONE_CLASSNAME[tone]);

  if (pending) {
    return (
      <span className={cn(chipClassName, 'opacity-70')}>
        <Loader2 className="size-3 animate-spin" />
        {label.toLowerCase().replace(/_/g, ' ')}
      </span>
    );
  }

  if (!options || options.length === 0) {
    return <span className={chipClassName}>{label.toLowerCase().replace(/_/g, ' ')}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(chipClassName, 'cursor-pointer outline-none hover:brightness-110')}>
        {label.toLowerCase().replace(/_/g, ' ')}
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onSelect?.(option.value)}>
            <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT_CLASSNAME[option.tone ?? 'default'])} />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
