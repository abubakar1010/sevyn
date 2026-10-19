import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Scrolls horizontally on narrow screens rather than breaking the page layout. */
export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table
        className={cn('w-full min-w-max text-left text-sm', className)}
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
export const Td = ({
  className,
  ...p
}: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      'border-b border-line px-4 py-3 align-middle last:border-b-0',
      className,
    )}
    {...p}
  />
)
