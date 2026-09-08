'use client';

import * as React from 'react';
import { flexRender, type HeaderGroup, type Row } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../utils/cn';

/** Flex-based header matching `VirtualizedBody`'s row layout (see its docstring for why). */
export function VirtualizedHeader<TData>({
  headerGroups,
}: {
  headerGroups: HeaderGroup<TData>[];
}) {
  return (
    <div role="rowgroup" className="border-b bg-muted/50">
      {headerGroups.map((headerGroup) => (
        <div key={headerGroup.id} role="row" className="flex w-full items-stretch">
          {headerGroup.headers.map((header) => (
            <div
              key={header.id}
              role="columnheader"
              className="flex flex-1 items-center px-4 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase"
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Opt-in row virtualization for large datasets (hundreds+ rows). Follows
 * TanStack's own table+virtual integration pattern: the scroll container is
 * a fixed-height `div`, and `table`/`thead`/`tbody`/`tr` switch to
 * `display: grid`/`flex` with absolutely-positioned rows so only the rows
 * near the viewport ever mount.
 *
 * Trade-off worth knowing: overriding table layout to grid/flex means some
 * browsers stop exposing the implicit ARIA `table`/`row`/`cell` roles from
 * the semantic tags alone. Reserve this for genuinely large, data-dense
 * tables (a trading log, an audit trail) rather than defaulting it on —
 * `DataTable`'s non-virtualized path (the default) keeps a fully semantic
 * `<table>`.
 */
export function VirtualizedBody<TData>({
  rows,
  estimateRowHeight,
  maxHeight,
  renderCell,
  columnCount,
}: {
  rows: Row<TData>[];
  estimateRowHeight: number;
  maxHeight: number | string;
  columnCount: number;
  renderCell: (cell: ReturnType<Row<TData>['getVisibleCells']>[number]) => React.ReactNode;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 8,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={scrollRef}
      data-slot="table-container"
      className="relative w-full overflow-auto rounded-xl border border-border"
      style={{ maxHeight }}
    >
      <div style={{ height: totalSize, position: 'relative', width: '100%' }} role="rowgroup">
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={row.id}
              role="row"
              data-state={row.getIsSelected() ? 'selected' : undefined}
              className={cn(
                'absolute top-0 left-0 flex w-full items-stretch border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
              )}
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  role="cell"
                  className="flex flex-1 items-center overflow-hidden px-4 py-2 text-sm whitespace-nowrap"
                >
                  {renderCell(cell)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <span className="sr-only">{columnCount} columns, {rows.length} rows</span>
    </div>
  );
}

export function renderVirtualCell<TData>(cell: ReturnType<Row<TData>['getVisibleCells']>[number]) {
  return flexRender(cell.column.columnDef.cell, cell.getContext());
}
