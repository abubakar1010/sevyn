import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'info'
const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-primary-100 text-primary-800 dark:bg-primary-500/25 dark:text-primary-100',
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}
