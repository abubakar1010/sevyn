import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { useSaveSettings, useSettings } from '@/data/hooks'

export function SettingsPage() {
  const settings = useSettings()
  const save = useSaveSettings()

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    save.mutate({
      name: String(f.get('name')).trim(),
      amberDays: Number(f.get('amberDays')),
    })
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation settings and compliance rules."
      />
      <QueryState queries={[settings]}>
        {settings.data && (
          <Card className="max-w-lg">
            <form
              key={settings.dataUpdatedAt}
              onSubmit={submit}
              className="flex flex-col gap-4"
            >
              <Field label="Organisation name">
                {(p) => (
                  <Input
                    name="name"
                    required
                    defaultValue={settings.data.name}
                    {...p}
                  />
                )}
              </Field>
              <Field
                label="Amber warning window (days)"
                hint="Items turn amber this many days before they expire."
              >
                {(p) => (
                  <Input
                    name="amberDays"
                    type="number"
                    min={1}
                    max={365}
                    required
                    defaultValue={settings.data.amberDays}
                    {...p}
                  />
                )}
              </Field>
              <Field
                label="Inactivity timeout"
                hint="Fixed at 10 minutes for security."
              >
                {(p) => <Input value="10 minutes" readOnly disabled {...p} />}
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={save.isPending}>
                  Save settings
                </Button>
                {save.isSuccess && (
                  <span role="status" className="text-sm text-slate-600">
                    Saved
                  </span>
                )}
                {save.isError && (
                  <span role="alert" className="text-sm text-red-700">
                    {save.error.message}
                  </span>
                )}
              </div>
            </form>
          </Card>
        )}
      </QueryState>
    </>
  )
}
