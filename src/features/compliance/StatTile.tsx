import { RagBadge } from '@/components/ui/RagBadge'
import { cn } from '@/lib/cn'
import { useCountUp } from '@/lib/useCountUp'
import type { Rag } from '@/types'

const TILE: Record<Rag, string> = {
  red: 'border-red-200 bg-linear-to-br from-red-50 to-white text-red-900',
  amber:
    'border-amber-200 bg-linear-to-br from-amber-50 to-white text-amber-900',
  green:
    'border-green-200 bg-linear-to-br from-green-50 to-white text-green-900',
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
