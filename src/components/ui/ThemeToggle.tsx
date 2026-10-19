import { useTheme } from '@/app/useTheme'
import { cn } from '@/lib/cn'

/** Sun/moon switch between light and dark mode. */
export function ThemeToggle({
  dark = false,
  className,
}: {
  dark?: boolean
  className?: string
}) {
  const { theme, toggle } = useTheme()
  const toDark = theme === 'light'
  return (
    <button
      onClick={toggle}
      aria-label={toDark ? 'Switch to dark mode' : 'Switch to light mode'}
      title={toDark ? 'Dark mode' : 'Light mode'}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition duration-200 active:scale-90',
        dark
          ? 'text-white/90 hover:bg-white/10'
          : 'text-slate-600 hover:bg-slate-100',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {toDark ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  )
}
