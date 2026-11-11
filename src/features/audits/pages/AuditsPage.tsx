import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import {
  useAddAudit,
  useAudits,
  useHomes,
  useSetAuditResolved,
} from '@/data/hooks'
import { daysFromNow } from '@/data/mock'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'

type Dialog = 'audit' | null

export function AuditsPage() {
  const canEdit = useCanEdit()
  const audits = useAudits()
  const homes = useHomes()
  const addAudit = useAddAudit()
  const resolve = useSetAuditResolved()
  const [dialog, setDialog] = useState<Dialog>(null)

  const today = daysFromNow(0)
  const homeName = (id: string) => homes.data?.find((h) => h.id === id)?.name

  function submitAudit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    addAudit.mutate(
      {
        homeId: String(f.get('homeId')),
        title: String(f.get('title')).trim(),
        auditDate: String(f.get('auditDate')),
        requiredAction: String(f.get('requiredAction')).trim(),
      },
      { onSuccess: () => setDialog(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Audits"
        description="Record audits and track the actions they require."
      />
      <QueryState queries={[audits, homes]}>
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Audits</h2>
            {canEdit && (
              <Button size="sm" onClick={() => setDialog('audit')}>
                Record audit
              </Button>
            )}
          </div>
          {audits.data?.length === 0 ? (
            <EmptyState title="No audits recorded" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {audits.data?.map((a) => (
                <Card key={a.id} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{a.title}</p>
                    {a.resolved ? (
                      <Badge>Actions complete</Badge>
                    ) : (
                      <RagBadge status="amber" label="Action required" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {homeName(a.homeId)} · {formatDate(a.auditDate)}
                  </p>
                  {a.requiredAction && (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm">
                      {a.requiredAction}
                    </p>
                  )}
                  {canEdit && a.requiredAction && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="self-start"
                      onClick={() =>
                        resolve.mutate({ id: a.id, resolved: !a.resolved })
                      }
                    >
                      {a.resolved ? 'Reopen' : 'Mark complete'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </QueryState>

      <Modal
        open={dialog === 'audit'}
        onClose={() => setDialog(null)}
        title="Record audit"
      >
        <form onSubmit={submitAudit} className="flex flex-col gap-4">
          <Field label="Audit title">
            {(p) => <Input name="title" required {...p} />}
          </Field>
          <Field label="Home">
            {(p) => (
              <Select name="homeId" required {...p}>
                {homes.data?.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Audit date">
            {(p) => (
              <Input
                name="auditDate"
                type="date"
                required
                defaultValue={today}
                {...p}
              />
            )}
          </Field>
          <Field
            label="Required action"
            hint="Leave blank if no action is needed."
          >
            {(p) => <Textarea name="requiredAction" {...p} />}
          </Field>
          <FormError error={addAudit.error} />
          <Button type="submit" disabled={addAudit.isPending}>
            Save audit
          </Button>
        </form>
      </Modal>
    </>
  )
}
