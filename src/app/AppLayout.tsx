import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { useSettings } from '@/data/hooks'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { cn } from '@/lib/cn'
import { ROLE_LABEL } from '@/lib/roles'
import { HeaderActions } from './HeaderActions'
import { OfstedToggle } from './OfstedToggle'
import { useAuth } from './useAuth'

export interface NavItem {
  to: string
  label: string
}

const today = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

export function AppLayout({ nav }: { nav: NavItem[] }) {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  const { enabled: ofsted } = useOfstedMode()
  const org = useSettings().data?.name

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 order-1 flex items-center justify-between bg-primary-950 px-4 py-2.5 text-white md:hidden">
        <Logo light />
        <HeaderActions dark showOfsted={false} />
      </header>

      <aside className="relative order-2 overflow-hidden bg-linear-to-b from-primary-950 via-primary-900 to-[oklch(0.3_0.13_290)] text-white md:sticky md:top-0 md:order-none md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 hidden size-56 animate-float rounded-full bg-accent-500/30 blur-3xl md:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 -left-20 hidden size-56 animate-float-slow rounded-full bg-primary-500/30 blur-3xl md:block"
        />
        <div className="relative hidden px-6 pt-7 pb-6 md:block">
          <Logo light />
        </div>
        <nav
          aria-label="Main"
          className="relative flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:overflow-y-auto md:px-4 md:pb-4"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 shrink-0 items-center rounded-lg px-3 font-medium whitespace-nowrap transition duration-200 md:hover:translate-x-0.5',
                  isActive
                    ? 'bg-white/15 text-white md:before:absolute md:before:top-2.5 md:before:bottom-2.5 md:before:-left-2 md:before:w-1 md:before:rounded-full md:before:bg-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <OfstedToggle dark className="ml-1 self-center md:hidden" />
        </nav>
        <p className="relative hidden px-6 pb-6 text-xs text-white/50 md:block">
          Compliance, made calm.
        </p>
      </aside>

      <div className="order-3 min-w-0 flex-1 md:order-none">
        <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-line bg-surface/75 px-8 py-3 backdrop-blur-md md:flex">
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-primary-950 dark:text-white">
              {org ?? 'Sevyn'}
            </p>
            <p className="text-xs text-slate-500">
              {profile ? ROLE_LABEL[profile.role] : ''} · {today()}
            </p>
          </div>
          <HeaderActions />
        </header>
        {ofsted && (
          <div
            role="status"
            className="animate-fade-in bg-linear-to-r from-primary-800 via-accent-700 to-primary-800 bg-size-[200%_100%] px-4 py-2 text-center text-sm font-medium text-white motion-safe:animate-gradient"
          >
            Ofsted Mode is on — personal details are masked
          </div>
        )}
        <main key={pathname} className="animate-fade-up p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
