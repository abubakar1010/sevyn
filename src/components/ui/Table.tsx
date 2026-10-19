import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

// Under `md` a stacked table becomes one card per row, each cell showing its
// `label` (from Td) beside the value, so no column is hidden off-screen.
const STACKED =
  'md:min-w-max max-md:block max-md:[&_thead]:hidden max-md:[&_tbody]:block max-md:[&_tr]:block max-md:[&_tr]:border-b max-md:[&_tr]:border-line max-md:[&_tr]:p-3 max-md:[&_tr:last-child]:border-b-0'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Set false for wide matrices that should scroll horizontally on phones. */
  stack?: boolean
}

export function Table({ className, stack = true, ...props }: TableProps) {
  return (
    <div className="relative overflow-x-auto rounded-card border border-line bg-surface shadow-card [&_tbody_tr:last-child_td]:border-b-0 md:[&_tbody_tr:hover_td]:bg-primary-50/50 dark:md:[&_tbody_tr:hover_td]:bg-white/5">
      <table
        className={cn(
          'w-full text-left text-sm',
          stack ? STACKED : 'min-w-max',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export const Th = ({
  className,
  ...p
}: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    scope="col"
    className={cn(
      'border-b border-line bg-slate-50 px-4 py-3 font-semibold text-slate-700',
      className,
    )}
    {...p}
  />
)

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Column name shown beside the value when the table is stacked on phones. */
  label?: string
}

export const Td = ({ className, label, ...p }: TdProps) => (
  <td
    data-label={label}
    className={cn(
      'border-b border-line px-4 py-3 align-middle transition-colors',
      'max-md:flex max-md:items-center max-md:gap-4 max-md:border-b-0 max-md:px-0 max-md:py-1.5 max-md:text-right',
      label ? 'max-md:justify-between' : 'max-md:justify-end',
      'before:content-[attr(data-label)] before:text-left before:font-medium before:text-slate-500 md:before:hidden',
      className,
    )}
    {...p}
  />
)
