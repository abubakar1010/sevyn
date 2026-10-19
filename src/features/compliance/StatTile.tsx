import { RagBadge } from '@/components/ui/RagBadge'
import { cn } from '@/lib/cn'
import { useCountUp } from '@/lib/useCountUp'
import type { Rag } from '@/types'

const TILE: Record<Rag, string> = {
  red: 'border-red-200 bg-linear-to-br from-red-50 to-white text-red-900 dark:border-red-900 dark:from-red-950/70 dark:to-surface dark:text-red-100',
  amber:
    'border-amber-200 bg-linear-to-br from-amber-50 to-white text-amber-900 dark:border-amber-900 dark:from-amber-950/70 dark:to-surface dark:text-amber-100',
  green:
    'border-green-200 bg-linear-to-br from-green-50 to-white text-green-900 dark:border-green-900 dark:from-green-950/70 dark:to-surface dark:text-green-100',
}

export function StatTile({ status, count }: { status: Rag; count: number }) {
  const shown = useCountUp(count)
  return (
    <div
      className={cn(
        'rounded-card border p-3 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift md:p-4',
        TILE[status],
        status === 'red' && count > 0 && 'motion-safe:animate-pulse-soft',
      )}
    >
      <p className="font-display text-4xl font-semibold">{shown}</p>
      <RagBadge status={status} />
    </div>
  )
}
