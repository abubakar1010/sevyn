import { useState, type FormEvent } from 'react'
import { useAuth } from '@/app/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormError } from '@/components/ui/FormError'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useArchiveYoungPerson,
  useHomes,
  useSaveYoungPerson,
  useUnits,
  useYoungPeople,
} from '@/data/hooks'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { YoungPerson, YoungPersonProfile } from '@/types'
import { DocumentsPanel } from '@/features/documents/DocumentsPanel'
import { YoungPersonRatings } from '@/features/quick-logs/QuickLogAnalytics'
import { youngPersonName } from '../display'
import { PROFILE_GROUPS } from '../profileFields'
import { YoungPersonInspectionFile } from '../YoungPersonInspectionFile'

type Editing = YoungPerson | 'new' | null

export function YoungPeoplePage() {
  const { profile } = useAuth()
  const canEdit = useCanEdit()
  const { enabled: ofsted } = useOfstedMode()
  const people = useYoungPeople()
  const homes = useHomes()
  const units = useUnits()
  const save = useSaveYoungPerson()
  const archive = useArchiveYoungPerson()
  const [archiving, setArchiving] = useState<YoungPerson | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const current = editing && editing !== 'new' ? editing : null
  const [fileId, setFileId] = useState<string | null>(null)
  const file = people.data?.find((y) => y.id === fileId) ?? null
  const [formHome, setFormHome] = useState('')
  const formUnits = (units.data ?? []).filter((u) => u.homeId === formHome)

  function startEditing(next: Editing) {
    setEditing(next)
    setFormHome(
      next && next !== 'new' ? next.homeId : (homes.data?.[0]?.id ?? ''),
    )
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    save.mutate(
      {
        id: current?.id,
        homeId: String(f.get('homeId')),
        fullName: String(f.get('fullName')).trim(),
        dateOfBirth: String(f.get('dob')),
        moveInDate: String(f.get('moveInDate') ?? ''),
        unitId: String(f.get('unitId') ?? '') || null,
        restricted: f.get('restricted') === 'on',
        ...(Object.fromEntries(
          PROFILE_GROUPS.flatMap((g) => g.fields).map((x) => [
            x.key,
            String(f.get(x.key) ?? '').trim(),
          ]),
        ) as unknown as YoungPersonProfile),
      },
      { onSuccess: () => setEditing(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Young people"
        description={
          profile?.role === 'responsible_individual'
            ? 'Records for every young person across all homes, including restricted files.'
            : 'Records for young people in your assigned homes.'
        }
        actions={
          canEdit && (
            <Button onClick={() => startEditing('new')}>
              Add young person
            </Button>
          )
        }
      />
      <QueryState queries={[people, homes, units]}>
        {people.data?.length === 0 ? (
          <EmptyState title="No records to show" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Home</Th>
                <Th>Date of birth</Th>
                <Th>Access</Th>
                {canEdit && (
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                )}
              </tr>
            </thead>
            <tbody>
              {people.data?.map((y) => (
                <tr key={y.id}>
                  <Td label="Name" className="font-medium">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      aria-label={`Open file for ${youngPersonName(y, ofsted)}`}
                      onClick={() => setFileId(y.id)}
                    >
                      {youngPersonName(y, ofsted)}
                    </button>
                  </Td>
                  <Td label="Home">
                    {homes.data?.find((h) => h.id === y.homeId)?.name}
                  </Td>
                  <Td label="Date of birth">{formatDate(y.dateOfBirth)}</Td>
                  <Td label="Access">
                    {y.restricted ? (
                      <Badge tone="info">Restricted</Badge>
                    ) : (
                      <Badge>Standard</Badge>
                    )}
                  </Td>
                  {canEdit && (
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${youngPersonName(y, ofsted)}`}
                        onClick={() => startEditing(y)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Archive ${youngPersonName(y, ofsted)}`}
                        onClick={() => setArchiving(y)}
                      >
                        Archive
                      </Button>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </QueryState>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? 'Edit record' : 'Add young person'}
      >
        {editing !== null && (
          <form
            key={current?.id ?? 'new'}
            onSubmit={submit}
            className="flex flex-col gap-4"
          >
            <Field label="Full name">
              {(p) => (
                <Input
                  name="fullName"
                  required
                  defaultValue={current?.fullName}
                  {...p}
                />
              )}
            </Field>
            <Field label="Home">
              {(p) => (
                <Select
                  name="homeId"
                  required
                  value={formHome}
                  onChange={(e) => setFormHome(e.target.value)}
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
            <Field label="Date of birth">
              {(p) => (
                <Input
                  name="dob"
                  type="date"
                  required
                  defaultValue={current?.dateOfBirth}
                  {...p}
                />
              )}
            </Field>
            <Field label="Move-in date">
              {(p) => (
                <Input
                  name="moveInDate"
                  type="date"
                  required
                  defaultValue={current?.moveInDate}
                  {...p}
                />
              )}
            </Field>
            <Field label="Unit" hint="Optional">
              {(p) => (
                <Select
                  key={formHome}
                  name="unitId"
                  defaultValue={
                    current?.homeId === formHome ? (current?.unitId ?? '') : ''
                  }
                  {...p}
                >
                  <option value="">No unit</option>
                  {formUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                name="restricted"
                defaultChecked={current?.restricted}
                className="size-5 accent-primary-700"
              />
              <span>
                <span className="font-medium">Restricted access</span>
                <span className="block text-sm text-slate-600">
                  Hidden from Support Workers (safeguarding restriction)
                </span>
              </span>
            </label>
            {PROFILE_GROUPS.map((g) => (
              <fieldset key={g.title} className="flex flex-col gap-4">
                <legend className="mb-2 text-sm font-semibold text-slate-900">
                  {g.title}
                </legend>
                {g.fields.map((x) => (
                  <Field key={x.key} label={x.label}>
                    {(p) =>
                      x.long ? (
                        <Textarea
                          name={x.key}
                          defaultValue={current?.[x.key]}
                          {...p}
                        />
                      ) : (
                        <Input
                          name={x.key}
                          type={x.type}
                          defaultValue={current?.[x.key]}
                          {...p}
                        />
                      )
                    }
                  </Field>
                ))}
              </fieldset>
            ))}
            <FormError error={save.error} />
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
          </form>
        )}
      </Modal>
      <Modal
        open={file !== null}
        onClose={() => setFileId(null)}
        title={file ? `File: ${youngPersonName(file, ofsted)}` : 'File'}
      >
        {file && ofsted && (
          <>
            <p
              role="status"
              className="mb-4 rounded-lg border border-line bg-surface p-3 text-sm text-slate-700"
            >
              Ofsted Mode: names are shown as initials, other young people’s
              names are hidden and staff names stay in full. Records are grouped
              under the Quality Standards.
            </p>
            <YoungPersonInspectionFile yp={file} masked />
          </>
        )}
        {file && !ofsted && (
          <>
            <section className="mb-5">
              <h3 className="mb-2 text-sm font-semibold">Placement</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-medium text-slate-800">Home</dt>
                  <dd className="text-slate-700">
                    {homes.data?.find((h) => h.id === file.homeId)?.name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-800">Unit</dt>
                  <dd className="text-slate-700">
                    {units.data?.find((u) => u.id === file.unitId)?.name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-800">Move-in date</dt>
                  <dd className="text-slate-700">
                    {file.moveInDate ? formatDate(file.moveInDate) : '—'}
                  </dd>
                </div>
              </dl>
            </section>
            {PROFILE_GROUPS.map((g) => (
              <section key={g.title} className="mb-5">
                <h3 className="mb-2 text-sm font-semibold">{g.title}</h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {g.fields.map((x) => (
                    <div key={x.key}>
                      <dt className="font-medium text-slate-800">{x.label}</dt>
                      <dd className="whitespace-pre-wrap text-slate-700">
                        {file[x.key] || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
            <section aria-label="Quick log progress" className="mb-5">
              <h3 className="mb-2 text-sm font-semibold">Quick log progress</h3>
              <YoungPersonRatings youngPersonId={file.id} />
            </section>
            <DocumentsPanel
              ownerType="young_person"
              ownerId={file.id}
              homeId={file.homeId}
            />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={archiving !== null}
        title="Archive record"
        message={`Archive the record for ${archiving ? youngPersonName(archiving, ofsted) : ''}? It will be removed from active lists, and the change is recorded in the audit log.`}
        confirmLabel="Archive"
        pending={archive.isPending}
        error={archive.error}
        onClose={() => setArchiving(null)}
        onConfirm={() =>
          archive.mutate(
            { id: archiving!.id },
            { onSuccess: () => setArchiving(null) },
          )
        }
      />
    </>
  )
}
