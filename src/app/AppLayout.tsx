import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { useAuth } from './useAuth'

export interface NavItem {
  to: string
  label: string
}

export function AppLayout({ nav }: { nav: NavItem[] }) {
  const { profile, signOut } = useAuth()
  const { enabled: ofsted, toggle } = useOfstedMode()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav
        aria-label="Main"
        className="flex gap-1 overflow-x-auto border-b border-line bg-surface p-2 md:w-64 md:shrink-0 md:flex-col md:border-r md:border-b-0 md:p-4"
      >
        <span className="hidden px-3 pb-4 text-xl font-semibold tracking-tight text-primary-800 md:block">
          Sevyn
        </span>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                'flex min-h-11 shrink-0 items-center rounded-lg px-3 font-medium whitespace-nowrap',
                isActive
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-slate-700 hover:bg-slate-100',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
        {profile?.role === 'registered_manager' && (
          <button
            onClick={toggle}
            aria-pressed={ofsted}
            className={cn(
              'flex min-h-11 shrink-0 items-center rounded-lg px-3 font-medium whitespace-nowrap md:mt-auto',
              ofsted
                ? 'bg-primary-900 text-white'
                : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            Ofsted Mode: {ofsted ? 'On' : 'Off'}
          </button>
        )}
        <button
          onClick={signOut}
          className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-slate-700 hover:bg-slate-100 "
        >
          Sign out
        </button>
      </nav>
      <div className="min-w-0 flex-1">
        {ofsted && (
          <div
            role="status"
            className="bg-primary-900 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Ofsted Mode is on — personal details are masked
          </div>
        )}
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
