import { useAmberDays } from '@/data/hooks'
import { RagBadge } from '@/components/ui/RagBadge'
import { formatDate } from '@/lib/format'
import { ragForDate } from '@/lib/rag'

export function DateStatus({ date }: { date: string | null }) {
  const amberDays = useAmberDays()
  return (
    <div className="flex flex-col items-start gap-1">
      <RagBadge
        status={ragForDate(date ? new Date(date) : null, undefined, amberDays)}
      />
      <span className="text-slate-600">{formatDate(date)}</span>
    </div>
  )
}
