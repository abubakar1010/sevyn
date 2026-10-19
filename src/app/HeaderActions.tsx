import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/cn'
import { initialsOf, ROLE_LABEL } from '@/lib/roles'
import { OfstedToggle } from './OfstedToggle'
import { useAuth } from './useAuth'

/** User chip and sign-out, plus the Ofsted toggle on desktop. Shared by both headers. */
export function HeaderActions({
  dark = false,
  showOfsted = true,
}: {
  dark?: boolean
  showOfsted?: boolean
}) {
  const { profile, signOut } = useAuth()
  if (!profile) return null

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {showOfsted && <OfstedToggle dark={dark} />}
      <ThemeToggle dark={dark} />
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-accent-700 text-sm font-semibold text-white ring-2 ring-white/70"
        >
          {initialsOf(profile.fullName)}
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-sm font-semibold">
            {profile.fullName}
          </span>
          <span
            className={cn(
              'block text-xs',
              dark ? 'text-white/70' : 'text-slate-500',
            )}
          >
            {ROLE_LABEL[profile.role]}
          </span>
        </span>
      </div>
      <button
        onClick={signOut}
        className={cn(
          'min-h-11 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors',
          dark
            ? 'text-white/90 hover:bg-white/10'
            : 'text-slate-600 hover:bg-slate-100',
        )}
      >
        Sign out
      </button>
    </div>
  )
}
