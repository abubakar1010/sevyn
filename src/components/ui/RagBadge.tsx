import type { Rag } from '@/types'
import { cn } from '@/lib/cn'

// Never colour alone: each status has a distinct icon and a text label.
const CONFIG: Record<Rag, { label: string; icon: string; style: string }> = {
  red: { label: 'Red', icon: '✕', style: 'bg-red-100 text-red-900' },
  amber: { label: 'Amber', icon: '!', style: 'bg-amber-100 text-amber-900' },
  green: { label: 'Green', icon: '✓', style: 'bg-green-100 text-green-900' },
}

export function RagBadge({ status, label }: { status: Rag; label?: string }) {
  const c = CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        c.style,
      )}
    >
      <span aria-hidden className="font-bold">
        {c.icon}
      </span>
      {label ?? c.label}
    </span>
  )
}
