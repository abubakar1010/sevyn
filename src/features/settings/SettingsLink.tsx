import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/useAuth'
import { cn } from '@/lib/cn'

/**
 * Takes the Responsible Individual straight to a section of Settings where the
 * company's own names are set. Renders nothing for other roles.
 */
export function SettingsLink({
  section,
  children,
  variant = 'button',
}: {
  section: 'staff-naming' | 'homes-naming' | 'document-categories'
  children: ReactNode
  variant?: 'button' | 'text'
}) {
  const { profile } = useAuth()
  if (profile?.role !== 'responsible_individual') return null
  return (
    <Link
      to={`/responsible-individual/settings#${section}`}
      className={cn(
        'print:hidden',
        variant === 'button'
          ? 'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-surface px-4 font-medium text-slate-800 hover:bg-slate-50'
          : 'text-sm font-medium text-primary-700 hover:underline dark:text-primary-200',
      )}
    >
      {children}
    </Link>
  )
}
