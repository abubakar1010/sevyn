import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { cn } from '@/lib/cn'
import { useAuth } from './useAuth'

/** Registered Managers' privacy switch; renders nothing for other roles. */
export function OfstedToggle({
  dark = false,
  className,
}: {
  dark?: boolean
  className?: string
}) {
  const { profile } = useAuth()
  const { enabled, toggle } = useOfstedMode()
  if (profile?.role !== 'registered_manager') return null
  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition duration-200 active:scale-95',
        enabled
          ? 'border-transparent bg-linear-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-accent-500/30'
          : dark
            ? 'border-white/25 text-white hover:bg-white/10'
            : 'border-slate-300 text-slate-700 hover:bg-slate-100',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full',
          enabled ? 'bg-white' : 'bg-slate-400',
        )}
      />
      Ofsted Mode: {enabled ? 'On' : 'Off'}
    </button>
  )
}
