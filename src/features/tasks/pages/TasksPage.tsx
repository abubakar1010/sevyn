import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import {
  useAddTask,
  useHomes,
  useSetTaskDone,
  useStaff,
  useTasks,
} from '@/data/hooks'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { daysFromNow } from '@/data/mock'
import { useCanEdit } from '@/lib/useCanEdit'

export function TasksPage() {
  const canEdit = useCanEdit()
  const tasks = useTasks()
  const homes = useHomes()
  const staff = useStaff()
  const add = useAddTask()
  const setDone = useSetTaskDone()
  const [open, setOpen] = useState(false)
  const [homeId, setHomeId] = useState('')

  const today = daysFromNow(0)
  const effectiveHome = homeId || homes.data?.[0]?.id || ''

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    add.mutate(
      {
        homeId: effectiveHome,
        title: String(f.get('title')).trim(),
        assigneeId: String(f.get('assigneeId')),
        dueDate: String(f.get('dueDate')),
      },
      { onSuccess: () => setOpen(false) },
    )
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
          canEdit && <Button onClick={() => setOpen(true)}>New task</Button>
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
                  <input
                    type="checkbox"
                    checked={t.done}
                    aria-label={`Mark "${t.title}" ${t.done ? 'not done' : 'done'}`}
                    onChange={(e) =>
                      setDone.mutate({ id: t.id, done: e.target.checked })
                    }
                    className="size-6 shrink-0 accent-primary-700"
                  />
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
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Title">
            {(p) => <Input name="title" required {...p} />}
          </Field>
          <Field label="Home">
            {(p) => (
              <Select
                value={effectiveHome}
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
              <Select key={effectiveHome} name="assigneeId" required {...p}>
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
                defaultValue={today}
                {...p}
              />
            )}
          </Field>
          <Button type="submit" disabled={add.isPending}>
            Create task
          </Button>
        </form>
      </Modal>
    </>
  )
}
