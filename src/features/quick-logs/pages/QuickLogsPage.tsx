import { useState, type FormEvent } from 'react'
import { useAuth } from '@/app/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import {
  useAddQuickLog,
  useQuickLogs,
  useStaff,
  useUpdateQuickLog,
  useYoungPeople,
} from '@/data/hooks'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { youngPersonName } from '@/features/young-people/display'
import { formatDateTime } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { QuickLog } from '@/types'
import { LOG_TAGS } from '../tags'

type Editing = QuickLog | 'new' | null

/** `datetime-local` inputs use local time without a zone, e.g. 2026-11-11T13:05. */
const toLocalInput = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)

export function QuickLogsPage() {
  const { profile } = useAuth()
  const canEditAll = useCanEdit()
  const { enabled: ofsted } = useOfstedMode()
  const logs = useQuickLogs()
  const people = useYoungPeople()
  const staff = useStaff()
  const add = useAddQuickLog()
  const update = useUpdateQuickLog()
  const [editing, setEditing] = useState<Editing>(null)
  const [filter, setFilter] = useState<string>('')
  const [personFilter, setPersonFilter] = useState<string>('')
  // Captured when the form opens so render stays pure.
  const [openedAt, setOpenedAt] = useState('')
  const startEditing = (value: Editing) => {
    setOpenedAt(toLocalInput(new Date()))
    setEditing(value)
  }

  const shown =
    logs.data?.filter(
      (l) =>
        (!filter || l.tags.includes(filter)) &&
        (!personFilter || l.youngPersonId === personFilter),
    ) ?? []

  const current = editing && editing !== 'new' ? editing : null

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const tags = f.getAll('tags').map(String)
    const note = String(f.get('note'))
    const occurredAt = new Date(String(f.get('occurredAt'))).toISOString()
    const done = { onSuccess: () => setEditing(null) }
    if (current) update.mutate({ id: current.id, tags, note, occurredAt }, done)
    else
      add.mutate(
        {
          youngPersonId: String(f.get('youngPersonId')),
          tags,
          note,
          occurredAt,
        },
        done,
      )
  }

  return (
    <>
      <PageHeader
        title="Quick logs"
        description="Daily observations and updates, tagged by progress area."
        actions={<Button onClick={() => startEditing('new')}>New log</Button>}
      />
      <QueryState queries={[logs, people, staff]}>
        <div className="mb-4 grid max-w-xl gap-3 sm:grid-cols-2">
          <Field label="Filter by young person">
            {(p) => (
              <Select
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
                {...p}
              >
                <option value="">All young people</option>
                {people.data?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {youngPersonName(y, ofsted)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Filter by tag">
            {(p) => (
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                {...p}
              >
                <option value="">All tags</option>
                {LOG_TAGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {shown.length === 0 ? (
          <EmptyState
            title="No logs yet"
            description="Logs you create will appear here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map((l) => {
              const yp = people.data?.find((y) => y.id === l.youngPersonId)
              return (
                <Card key={l.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {yp ? youngPersonName(yp, ofsted) : 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {staff.data?.find((s) => s.id === l.authorId)?.fullName ??
                        'Staff'}{' '}
                      · {formatDateTime(l.occurredAt)}
                      {l.createdAt !== l.occurredAt &&
                        ` (logged ${formatDateTime(l.createdAt)})`}
                    </p>
                  </div>
                  <p>{l.note}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {l.tags.map((t) => (
                        <Badge key={t} tone="info">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    {(canEditAll || l.authorId === profile?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit log for ${yp ? youngPersonName(yp, ofsted) : 'young person'}`}
                        onClick={() => startEditing(l)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </QueryState>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? 'Edit quick log' : 'New quick log'}
      >
        {editing !== null && (
          <form
            key={current?.id ?? 'new'}
            onSubmit={submit}
            className="flex flex-col gap-4"
          >
            <Field label="Young person">
              {(p) => (
                <Select
                  name="youngPersonId"
                  required
                  defaultValue={current?.youngPersonId}
                  disabled={current !== null}
                  {...p}
                >
                  {people.data?.map((y) => (
                    <option key={y.id} value={y.id}>
                      {youngPersonName(y, ofsted)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label="When it happened"
              hint="Change this if you are writing the log up later."
            >
              {(p) => (
                <Input
                  name="occurredAt"
                  type="datetime-local"
                  required
                  max={openedAt}
                  defaultValue={
                    current
                      ? toLocalInput(new Date(current.occurredAt))
                      : openedAt
                  }
                  {...p}
                />
              )}
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-800">
                Progress tags
              </legend>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {LOG_TAGS.map((t) => (
                  <label key={t} className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      name="tags"
                      value={t}
                      defaultChecked={current?.tags.includes(t)}
                      className="size-5 accent-primary-700"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Observation">
              {(p) => (
                <Textarea
                  name="note"
                  required
                  defaultValue={current?.note}
                  {...p}
                />
              )}
            </Field>
            <FormError error={current ? update.error : add.error} />
            <Button type="submit" disabled={add.isPending || update.isPending}>
              {current ? 'Save changes' : 'Save log'}
            </Button>
          </form>
        )}
      </Modal>
    </>
  )
}
