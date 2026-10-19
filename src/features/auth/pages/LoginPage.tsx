import { useNavigate } from 'react-router-dom'
import { HOME_BY_ROLE } from '@/app/homeByRole'
import { useAuth } from '@/app/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { demoUsers } from '@/data/demoUsers'

const ROLE_LABEL = {
  admin: 'Admin',
  registered_manager: 'Registered Manager',
  support_worker: 'Support Worker',
}

// TODO: password + authenticator 2FA for admins/managers; emailed one-time code for support workers.
export function LoginPage() {
  const { signInAs } = useAuth()
  const navigate = useNavigate()
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-800">
          Sevyn
        </h1>
        <p className="mt-1 mb-6 text-slate-600">Sign in to continue</p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Email">
            {(p) => <Input type="email" autoComplete="email" {...p} />}
          </Field>
          <Button type="submit">Continue</Button>
        </form>
        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">
            Demo tenant (fictional data)
          </p>
          <div className="flex flex-col gap-2">
            {demoUsers.map((u) => (
              <Button
                key={u.id}
                variant="secondary"
                onClick={() => {
                  signInAs(u)
                  navigate(HOME_BY_ROLE[u.role])
                }}
              >
                Continue as {ROLE_LABEL[u.role]}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </main>
  )
}
