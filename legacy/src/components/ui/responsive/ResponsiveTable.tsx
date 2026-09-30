import * as React from 'react';
import { cn } from '@/src/lib/cn';

export interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sticky first column (useful for size-charts so the row label stays visible) */
  stickyFirstCol?: boolean;
}

export const ResponsiveTable = React.forwardRef<HTMLDivElement, ResponsiveTableProps>(
  ({ className, stickyFirstCol = false, children, ...rest }, ref) => (
    <div
      ref={ref}
      role="region"
      aria-label="scrollable table"
      tabIndex={0}
      className={cn(
        'tool-table-wrap',
        stickyFirstCol && [
          '[&_th:first-child]:sticky [&_td:first-child]:sticky',
          '[&_th:first-child]:left-0 [&_td:first-child]:left-0',
          '[&_th:first-child]:z-[1]',
          '[&_th:first-child]:bg-[var(--color-surface)] [&_td:first-child]:bg-[var(--color-surface)]',
        ].join(' '),
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
);
ResponsiveTable.displayName = 'ResponsiveTable';

// ─── DataTable: data-driven, auto card-mode on mobile ────────────────────────

export interface DataTableColumn<T> {
  key: string;
  /** Display label (header) */
  label: string;
  /** Render the cell value from row data */
  render: (row: T, index: number) => React.ReactNode;
  /** Tailwind alignment hint for table mode (e.g. 'text-right') */
  align?: 'left' | 'right' | 'center';
  /** Hide on mobile card mode (use for noise columns) */
  hideInCards?: boolean;
  /** Promote to card header (only first promoted column wins) */
  cardTitle?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Force layout. Default: table on `sm:`+, cards on mobile. */
  layout?: 'auto' | 'table' | 'cards';
  /** Custom row key getter */
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
  /** When data is empty */
  emptyHint?: React.ReactNode;
  /** Optional CSS for the table element itself */
  tableClassName?: string;
}

/**
 * Data-driven table that automatically switches to card layout on mobile.
 *
 * Designed for finance/network tools with many columns that overflow on phone.
 * Card mode: each row becomes a card with key-value pairs.
 *
 * Example:
 *   <DataTable
 *     data={amortisationSchedule}
 *     columns={[
 *       { key: 'month', label: '№', render: r => r.month, cardTitle: true },
 *       { key: 'payment', label: 'Платёж', render: r => fmt(r.payment), align: 'right' },
 *       { key: 'balance', label: 'Остаток', render: r => fmt(r.balance), align: 'right' },
 *     ]}
 *   />
 */
export function DataTable<T>({
  columns,
  data,
  layout = 'auto',
  rowKey,
  className,
  emptyHint,
  tableClassName,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyHint) {
    return <div className={cn('rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)]', className)}>{emptyHint}</div>;
  }

  const tableMode = layout === 'table';
  const cardMode = layout === 'cards';
  const autoMode = layout === 'auto';

  const getKey = (row: T, i: number) => rowKey?.(row, i) ?? i;

  const alignClass = (a: DataTableColumn<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  const tableEl = (
    <ResponsiveTable className={cn(autoMode && 'hidden sm:block', className)}>
      <table className={cn('w-full border-collapse text-sm', tableClassName)}>
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            {columns.map(c => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap border-b border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]',
                  alignClass(c.align),
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={getKey(row, i)} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-muted)]">
              {columns.map(c => (
                <td key={c.key} className={cn('px-3 py-2 align-top', alignClass(c.align))}>
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ResponsiveTable>
  );

  const cards = (
    <div className={cn('flex flex-col gap-2', autoMode && 'sm:hidden', className)}>
      {data.map((row, i) => {
        const titleCol = columns.find(c => c.cardTitle);
        const bodyCols = columns.filter(c => !c.hideInCards && c !== titleCol);
        return (
          <div
            key={getKey(row, i)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            {titleCol && (
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  {titleCol.label}
                </span>
                <span className="text-sm font-bold text-[var(--color-text)]">
                  {titleCol.render(row, i)}
                </span>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
              {bodyCols.map(c => (
                <React.Fragment key={c.key}>
                  <dt className="text-[var(--color-text-muted)]">{c.label}</dt>
                  <dd className={cn('font-medium text-[var(--color-text)]', alignClass(c.align || 'right'))}>
                    {c.render(row, i)}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );

  if (tableMode) return tableEl;
  if (cardMode) return cards;
  // auto
  return (
    <>
      {tableEl}
      {cards}
    </>
  );
}
