import { useNavigate } from 'react-router-dom'
import { HOME_BY_ROLE } from '@/app/homeByRole'
import { useAuth } from '@/app/useAuth'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { demoUsers } from '@/data/demoUsers'
import { ROLE_LABEL } from '@/lib/roles'
import type { Role } from '@/types'

const ROLE_BLURB: Record<Role, string> = {
  admin: 'Homes, users and settings',
  registered_manager: 'Homes, staff, young people and Ofsted Mode',
  support_worker: 'Daily logs, tasks and your home’s status',
}

const PROMISES = [
  'Live red, amber and green status from real dates',
  'Every provider’s data kept strictly separate',
  'Inspection-ready with Ofsted Mode',
]

// TODO: password + authenticator 2FA for admins/managers; emailed one-time code for support workers.
export function LoginPage() {
  const { signInAs } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside
        aria-label="About Sevyn"
        className="relative flex flex-col justify-between overflow-hidden bg-linear-to-br from-primary-950 via-primary-800 to-[oklch(0.36_0.17_295)] bg-size-[200%_200%] p-6 text-white motion-safe:animate-gradient md:w-[46%] md:p-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-10 size-72 animate-float rounded-full bg-accent-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 size-80 animate-float-slow rounded-full bg-primary-500/35 blur-3xl"
        />
        <Logo light className="relative" />
        <div className="relative my-8 md:my-0">
          <p className="font-display text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
            Compliance,
            <br />
            made calm.
          </p>
          <p className="mt-4 max-w-sm text-white/80">
            One secure place for children’s residential providers to stay on top
            of staff, safeguarding and inspections.
          </p>
          <ul className="stagger mt-6 hidden flex-col gap-3 md:flex">
            {PROMISES.map((p) => (
              <li
                key={p}
                className="flex items-center gap-3 text-sm text-white/90"
              >
                <span
                  aria-hidden
                  className="flex size-6 items-center justify-center rounded-full bg-white/15 text-xs"
                >
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative hidden text-xs text-white/50 md:block">
          Sevyn · demo environment with fictional data
        </p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center p-6 pt-16 md:p-12">
        <ThemeToggle className="absolute top-3 right-3 z-10" />
        <div className="w-full max-w-sm animate-fade-up">
          <h1 className="text-3xl font-semibold tracking-tight text-primary-950 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 mb-6 text-slate-600">Sign in to continue.</p>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <Field label="Email">
              {(p) => <Input type="email" autoComplete="email" {...p} />}
            </Field>
            <Button type="submit">Continue</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs tracking-wider text-slate-500 uppercase">
            <span className="h-px flex-1 bg-line" />
            Explore the demo
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="stagger flex flex-col gap-2.5">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  signInAs(u)
                  navigate(HOME_BY_ROLE[u.role])
                }}
                className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-left shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lift active:scale-[0.98]"
              >
                <span>
                  <span className="block font-medium">
                    Continue as {ROLE_LABEL[u.role]}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {ROLE_BLURB[u.role]}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="text-primary-600 transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
