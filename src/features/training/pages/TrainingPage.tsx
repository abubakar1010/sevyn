import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useAddTrainingCourse,
  useAddTrainingRecord,
  useAmberDays,
  useStaff,
  useTrainingCourses,
  useTrainingRecords,
} from '@/data/hooks'
import { formatDate } from '@/lib/format'
import { ragForDate } from '@/lib/rag'
import { useCanEdit } from '@/lib/useCanEdit'

const CORE = 'Safeguarding'

type Dialog = 'record' | 'course' | null

export function TrainingPage() {
  const canEdit = useCanEdit()
  const staff = useStaff()
  const records = useTrainingRecords()
  const courseList = useTrainingCourses()
  const add = useAddTrainingRecord()
  const addCourse = useAddTrainingCourse()
  const amberDays = useAmberDays()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [fileId, setFileId] = useState<string | null>(null)

  const courses = [CORE, ...(courseList.data ?? []).map((c) => c.name)]
  const member = staff.data?.find((s) => s.id === fileId) ?? null

  function expiryFor(staffId: string, course: string) {
    const m = staff.data?.find((s) => s.id === staffId)
    return course === CORE
      ? m?.safeguardingExpiry
      : records.data
          ?.filter((r) => r.staffId === staffId && r.course === course)
          .sort((a, b) =>
            (b.expiresOn ?? '').localeCompare(a.expiresOn ?? ''),
          )[0]?.expiresOn
  }

  function cell(staffId: string, course: string) {
    const expiry = expiryFor(staffId, course)
    if (expiry === undefined)
      return <span className="text-slate-500">Not recorded</span>
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
    const certificate = f.get('certificate') as File | null
    add.mutate(
      {
        staffId: String(f.get('staffId')),
        course: String(f.get('course')).trim(),
        completedOn: String(f.get('completedOn')),
        expiresOn: String(f.get('expiresOn') || '') || null,
        certificateFileName: certificate?.name || undefined,
      },
      { onSuccess: () => setDialog(null) },
    )
  }

  function submitCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    addCourse.mutate(
      { name: String(f.get('name')) },
      { onSuccess: () => setDialog(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Training matrix"
        description="Completion and expiry for each training, by staff member. Select a name to see their certificates."
        actions={
          canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setDialog('course')}>
                Add training
              </Button>
              <Button onClick={() => setDialog('record')}>
                Add training record
              </Button>
            </div>
          )
        }
      />
      <QueryState queries={[staff, records, courseList]}>
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
                <Td className="font-medium">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    aria-label={`Open training for ${s.fullName}`}
                    onClick={() => setFileId(s.id)}
                  >
                    {s.fullName}
                  </button>
                </Td>
                {courses.map((c) => (
                  <Td key={c}>{cell(s.id, c)}</Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </QueryState>

      <Modal
        open={dialog === 'record'}
        onClose={() => setDialog(null)}
        title="Add training record"
      >
        {dialog === 'record' && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Staff member">
              {(p) => (
                <Select
                  name="staffId"
                  required
                  defaultValue={fileId ?? undefined}
                  {...p}
                >
                  {staff.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Training">
              {(p) => (
                <Select name="course" required {...p}>
                  {courses
                    .filter((c) => c !== CORE)
                    .map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                </Select>
              )}
            </Field>
            <Field label="Completed on">
              {(p) => <Input name="completedOn" type="date" required {...p} />}
            </Field>
            <Field
              label="Expires on"
              hint="Set by your company, e.g. yearly or every 6 months. Leave blank if it does not expire."
            >
              {(p) => <Input name="expiresOn" type="date" {...p} />}
            </Field>
            <Field
              label="Certificate"
              hint="Optional. Demo: only the file name is recorded; nothing is uploaded."
            >
              {(p) => <Input name="certificate" type="file" {...p} />}
            </Field>
            <FormError error={add.error} />
            <Button type="submit" disabled={add.isPending}>
              Save record
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={dialog === 'course'}
        onClose={() => setDialog(null)}
        title="Add training"
      >
        {dialog === 'course' && (
          <form onSubmit={submitCourse} className="flex flex-col gap-4">
            <Field
              label="Training name"
              hint="Adds a new column to the matrix for every staff member."
            >
              {(p) => (
                <Input
                  name="name"
                  required
                  placeholder="e.g. Manual Handling"
                  {...p}
                />
              )}
            </Field>
            <FormError error={addCourse.error} />
            <Button type="submit" disabled={addCourse.isPending}>
              Add training
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={member !== null}
        onClose={() => setFileId(null)}
        title={member ? `Training: ${member.fullName}` : 'Training'}
      >
        {member && (
          <>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {courses.map((c) => {
                const record = records.data
                  ?.filter((r) => r.staffId === member.id && r.course === c)
                  .sort((a, b) =>
                    (b.expiresOn ?? '').localeCompare(a.expiresOn ?? ''),
                  )[0]
                return (
                  <li
                    key={c}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  >
                    <span>
                      <span className="font-medium">{c}</span>
                      <span className="block text-slate-600">
                        {record
                          ? `Completed ${formatDate(record.completedOn)}`
                          : c === CORE
                            ? 'Tracked from the staff profile'
                            : 'Not recorded'}
                        {record?.certificateFileName &&
                          ` · Certificate: ${record.certificateFileName}`}
                      </span>
                    </span>
                    {cell(member.id, c)}
                  </li>
                )
              })}
            </ul>
            {canEdit && (
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setDialog('record')}
              >
                Add training record
              </Button>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
