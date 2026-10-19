import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import {
  useAddTask,
  useDeleteTask,
  useHomes,
  useSetTaskDone,
  useStaff,
  useTasks,
  useUpdateTask,
} from '@/data/hooks'
import { daysFromNow } from '@/data/mock'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { Task } from '@/types'

type Editing = Task | 'new' | null

export function TasksPage() {
  const canEdit = useCanEdit()
  const tasks = useTasks()
  const homes = useHomes()
  const staff = useStaff()
  const add = useAddTask()
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const setDone = useSetTaskDone()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [homeId, setHomeId] = useState('')

  const today = daysFromNow(0)
  const current = editing && editing !== 'new' ? editing : null
  const effectiveHome = current?.homeId ?? (homeId || homes.data?.[0]?.id || '')
  const saving = add.isPending || update.isPending
  const saveError = current ? update.error : add.error

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const fields = {
      title: String(f.get('title')).trim(),
      assigneeId: String(f.get('assigneeId')),
      dueDate: String(f.get('dueDate')),
    }
    const done = { onSuccess: () => setEditing(null) }
    if (current) update.mutate({ id: current.id, ...fields }, done)
    else add.mutate({ homeId: effectiveHome, ...fields }, done)
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          canEdit
            ? 'Create, assign and track compliance and operational tasks.'
            : 'Tasks assigned to you.'
        }
        actions={
          canEdit && <Button onClick={() => setEditing('new')}>New task</Button>
        }
      />
      <QueryState queries={[tasks, homes, staff]}>
        {tasks.data?.length === 0 ? (
          <EmptyState title="No tasks" />
        ) : (
          <ul className="flex flex-col gap-3">
            {tasks.data?.map((t) => (
              <li key={t.id}>
                <Card className="flex items-center gap-3">
                  <label className="-m-2 flex size-11 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={t.done}
                      aria-label={`Mark "${t.title}" ${t.done ? 'not done' : 'done'}`}
                      onChange={(e) =>
                        setDone.mutate({ id: t.id, done: e.target.checked })
                      }
                      className="size-6 accent-primary-700"
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'font-medium',
                        t.done && 'text-slate-500 line-through',
                      )}
                    >
                      {t.title}
                    </p>
                    <p className="text-sm text-slate-600">
                      {staff.data?.find((s) => s.id === t.assigneeId)?.fullName}{' '}
                      · {homes.data?.find((h) => h.id === t.homeId)?.name} · due{' '}
                      {formatDate(t.dueDate)}
                    </p>
                  </div>
                  {t.done ? (
                    <Badge>Done</Badge>
                  ) : t.dueDate < today ? (
                    <RagBadge status="red" label="Overdue" />
                  ) : null}
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${t.title}`}
                        onClick={() => setEditing(t)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${t.title}`}
                        onClick={() => setDeleting(t)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? 'Edit task' : 'New task'}
      >
        {editing !== null && (
          <form
            key={current?.id ?? 'new'}
            onSubmit={submit}
            className="flex flex-col gap-4"
          >
            <Field label="Title">
              {(p) => (
                <Input
                  name="title"
                  required
                  defaultValue={current?.title}
                  {...p}
                />
              )}
            </Field>
            <Field label="Home">
              {(p) => (
                <Select
                  value={effectiveHome}
                  disabled={current !== null}
                  onChange={(e) => setHomeId(e.target.value)}
                  {...p}
                >
                  {homes.data?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Assign to">
              {(p) => (
                <Select
                  key={effectiveHome}
                  name="assigneeId"
                  required
                  defaultValue={current?.assigneeId}
                  {...p}
                >
                  {staff.data
                    ?.filter((s) => s.homeId === effectiveHome)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
            <Field label="Due date">
              {(p) => (
                <Input
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={current?.dueDate ?? today}
                  {...p}
                />
              )}
            </Field>
            <FormError error={saveError} />
            <Button type="submit" disabled={saving}>
              {current ? 'Save changes' : 'Create task'}
            </Button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete task"
        message={`Delete "${deleting?.title}"? This cannot be undone, but the deletion is recorded in the audit log.`}
        confirmLabel="Delete task"
        pending={remove.isPending}
        error={remove.error}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          remove.mutate(
            { id: deleting!.id },
            { onSuccess: () => setDeleting(null) },
          )
        }
      />
    </>
  )
}
