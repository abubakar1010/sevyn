import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useAddAudit,
  useAddPolicy,
  useAmberDays,
  useAudits,
  useHomes,
  useMarkPolicyReviewed,
  usePolicies,
  useSetAuditResolved,
} from '@/data/hooks'
import { daysFromNow } from '@/data/mock'
import { formatDate } from '@/lib/format'
import { ragForDate } from '@/lib/rag'
import { useCanEdit } from '@/lib/useCanEdit'

type Dialog = 'audit' | 'policy' | null

export function AuditsPoliciesPage() {
  const canEdit = useCanEdit()
  const audits = useAudits()
  const policies = usePolicies()
  const homes = useHomes()
  const amberDays = useAmberDays()
  const addAudit = useAddAudit()
  const resolve = useSetAuditResolved()
  const addPolicy = useAddPolicy()
  const reviewed = useMarkPolicyReviewed()
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

  function submitPolicy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    addPolicy.mutate(
      {
        title: String(f.get('title')).trim(),
        reviewDue: String(f.get('reviewDue')),
      },
      { onSuccess: () => setDialog(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Audits & Policies"
        description="Record audits, track the actions they require, and keep policy reviews up to date."
      />
      <QueryState queries={[audits, policies, homes]}>
        <section className="mb-10">
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

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Policy reviews</h2>
            {canEdit && (
              <Button size="sm" onClick={() => setDialog('policy')}>
                Add policy
              </Button>
            )}
          </div>
          {policies.data?.length === 0 ? (
            <EmptyState title="No policies" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Policy</Th>
                  <Th>Last reviewed</Th>
                  <Th>Next review</Th>
                  {canEdit && (
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  )}
                </tr>
              </thead>
              <tbody>
                {policies.data?.map((p) => (
                  <tr key={p.id}>
                    <Td label="Policy" className="font-medium">
                      {p.title}
                    </Td>
                    <Td label="Last reviewed">{formatDate(p.lastReviewed)}</Td>
                    <Td label="Next review">
                      <div className="flex flex-col items-start gap-1">
                        <RagBadge
                          status={ragForDate(
                            new Date(p.reviewDue),
                            undefined,
                            amberDays,
                          )}
                        />
                        <span className="text-slate-600">
                          {formatDate(p.reviewDue)}
                        </span>
                      </div>
                    </Td>
                    {canEdit && (
                      <Td>
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Mark ${p.title} reviewed`}
                          disabled={reviewed.isPending}
                          onClick={() => reviewed.mutate({ id: p.id })}
                        >
                          Mark reviewed
                        </Button>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
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
          <Button type="submit" disabled={addAudit.isPending}>
            Save audit
          </Button>
        </form>
      </Modal>
      <Modal
        open={dialog === 'policy'}
        onClose={() => setDialog(null)}
        title="Add policy"
      >
        <form onSubmit={submitPolicy} className="flex flex-col gap-4">
          <Field label="Policy title">
            {(p) => <Input name="title" required {...p} />}
          </Field>
          <Field label="Next review due">
            {(p) => <Input name="reviewDue" type="date" required {...p} />}
          </Field>
          <Button type="submit" disabled={addPolicy.isPending}>
            Save policy
          </Button>
        </form>
      </Modal>
    </>
  )
}
