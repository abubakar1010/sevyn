import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import {
  useAddInterimMeasure,
  useHomes,
  useInterimMeasures,
  useStaff,
  useTrainingRecords,
  useAmberDays,
} from '@/data/hooks'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import { buildComplianceItems } from '@/features/compliance/compliance'
import type { ComplianceItem } from '@/types'

export function InterimMeasuresPage() {
  const canEdit = useCanEdit()
  const staff = useStaff()
  const training = useTrainingRecords()
  const measures = useInterimMeasures()
  const amberDays = useAmberDays()
  const homes = useHomes()
  const add = useAddInterimMeasure()
  const [target, setTarget] = useState<ComplianceItem | null>(null)

  const allItems =
    staff.data && training.data && measures.data
      ? buildComplianceItems(
          staff.data,
          training.data,
          measures.data,
          undefined,
          amberDays,
        )
      : []
  const red = allItems.filter((i) => i.status === 'red')
  // A measure closes automatically once its item is no longer red; keep it as history.
  const closed = (measures.data ?? []).flatMap((m) => {
    const item = allItems.find((i) => i.key === m.itemKey)
    return item && item.status !== 'red' ? [{ measure: m, item }] : []
  })
  const needsNote = red.filter((i) => !i.interimMeasure)
  const active = red.filter((i) => i.interimMeasure)
  const homeName = (id: string) => homes.data?.find((h) => h.id === id)?.name

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const note = String(new FormData(e.currentTarget).get('note'))
    add.mutate(
      { itemKey: target!.key, note },
      { onSuccess: () => setTarget(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Interim measures"
        description="A note is required whenever a compliance item is red. It stays visible to staff until the item is green again."
      />
      <QueryState queries={[staff, training, measures, homes]}>
        {canEdit && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Needs a note</h2>
            {needsNote.length === 0 ? (
              <EmptyState
                title="Nothing needs a note"
                description="Every red item has an interim measure."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {needsNote.map((i) => (
                  <Card
                    key={i.key}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">
                        {i.label} — {i.subject}
                      </p>
                      <p className="text-sm text-slate-600">
                        {homeName(i.homeId)} · due {formatDate(i.due)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setTarget(i)}>
                      Add note
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        <h2 className="mb-3 text-lg font-semibold">Active measures</h2>
        {active.length === 0 ? (
          <EmptyState title="No active interim measures" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((i) => (
              <Card key={i.key} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">
                    {i.label} — {i.subject}
                  </p>
                  <RagBadge status="red" />
                </div>
                <p className="text-sm text-slate-600">
                  {homeName(i.homeId)} · added{' '}
                  {formatDate(i.interimMeasure!.createdAt)}
                </p>
                <p className="rounded-lg bg-slate-50 p-3 text-sm">
                  {i.interimMeasure!.note}
                </p>
              </Card>
            ))}
          </div>
        )}

        {closed.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Closed measures</h2>
            <ul className="divide-y divide-line rounded-card border border-line bg-surface text-sm">
              {closed.map(({ measure, item }) => (
                <li key={measure.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {item.label} — {item.subject}
                    </span>
                    <RagBadge status={item.status} label="Resolved" />
                  </div>
                  <span className="text-slate-600">
                    {homeName(item.homeId)} · added{' '}
                    {formatDate(measure.createdAt)}
                  </span>
                  <span>{measure.note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </QueryState>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Add interim measure"
      >
        {target && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-700">
              {target.label} — {target.subject}
            </p>
            <Field
              label="Interim measure note"
              hint="Describe what staff must do until this is resolved"
            >
              {(p) => <Textarea name="note" required minLength={5} {...p} />}
            </Field>
            <FormError error={add.error} />
            <Button type="submit" disabled={add.isPending}>
              Save note
            </Button>
          </form>
        )}
      </Modal>
    </>
  )
}
