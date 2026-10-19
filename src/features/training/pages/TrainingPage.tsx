import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useAddTrainingRecord,
  useAmberDays,
  useStaff,
  useTrainingRecords,
} from '@/data/hooks'
import { ragForDate } from '@/lib/rag'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'

const CORE = 'Safeguarding'

export function TrainingPage() {
  const canEdit = useCanEdit()
  const staff = useStaff()
  const records = useTrainingRecords()
  const add = useAddTrainingRecord()
  const amberDays = useAmberDays()
  const [open, setOpen] = useState(false)

  const courses = [CORE, ...new Set((records.data ?? []).map((r) => r.course))]

  function cell(staffId: string, course: string) {
    const member = staff.data?.find((s) => s.id === staffId)
    const expiry =
      course === CORE
        ? member?.safeguardingExpiry
        : records.data
            ?.filter((r) => r.staffId === staffId && r.course === course)
            .sort((a, b) =>
              (b.expiresOn ?? '').localeCompare(a.expiresOn ?? ''),
            )[0]?.expiresOn
    if (expiry === undefined)
      return <span className="text-slate-500">Not required</span>
    return (
      <div className="flex flex-col items-start gap-1">
        <RagBadge
          status={ragForDate(
            expiry ? new Date(expiry) : null,
            undefined,
            amberDays,
          )}
        />
        <span className="text-slate-600">{formatDate(expiry)}</span>
      </div>
    )
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    add.mutate(
      {
        staffId: String(f.get('staffId')),
        course: String(f.get('course')).trim(),
        completedOn: String(f.get('completedOn')),
        expiresOn: String(f.get('expiresOn') || '') || null,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      <PageHeader
        title="Training matrix"
        description="Completion and expiry for each course, by staff member."
        actions={
          canEdit && (
            <Button onClick={() => setOpen(true)}>Add training record</Button>
          )
        }
      />
      <QueryState queries={[staff, records]}>
        <Table stack={false}>
          <thead>
            <tr>
              <Th>Staff member</Th>
              {courses.map((c) => (
                <Th key={c}>{c}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.data?.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium">{s.fullName}</Td>
                {courses.map((c) => (
                  <Td key={c}>{cell(s.id, c)}</Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </QueryState>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add training record"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Staff member">
            {(p) => (
              <Select name="staffId" required {...p}>
                {staff.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Course">
            {(p) => (
              <Input
                name="course"
                required
                placeholder="e.g. First Aid"
                {...p}
              />
            )}
          </Field>
          <Field label="Completed on">
            {(p) => <Input name="completedOn" type="date" required {...p} />}
          </Field>
          <Field label="Expires on" hint="Leave blank if it does not expire">
            {(p) => <Input name="expiresOn" type="date" {...p} />}
          </Field>
          <FormError error={add.error} />
          <Button type="submit" disabled={add.isPending}>
            Save record
          </Button>
        </form>
      </Modal>
    </>
  )
}
