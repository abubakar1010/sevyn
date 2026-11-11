import { useState, type FormEvent } from 'react'
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
  useYoungPeople,
} from '@/data/hooks'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { YoungPerson, YoungPersonProfile } from '@/types'
import { DocumentsPanel } from '@/features/documents/DocumentsPanel'
import { youngPersonName } from '../display'
import { PROFILE_GROUPS } from '../profileFields'

type Editing = YoungPerson | 'new' | null

export function YoungPeoplePage() {
  const canEdit = useCanEdit()
  const { enabled: ofsted } = useOfstedMode()
  const people = useYoungPeople()
  const homes = useHomes()
  const save = useSaveYoungPerson()
  const archive = useArchiveYoungPerson()
  const [archiving, setArchiving] = useState<YoungPerson | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const current = editing && editing !== 'new' ? editing : null
  const [fileId, setFileId] = useState<string | null>(null)
  const file = people.data?.find((y) => y.id === fileId) ?? null

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    save.mutate(
      {
        id: current?.id,
        homeId: String(f.get('homeId')),
        fullName: String(f.get('fullName')).trim(),
        dateOfBirth: String(f.get('dob')),
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
        description="Records for young people in your assigned homes."
        actions={
          canEdit && (
            <Button onClick={() => setEditing('new')}>Add young person</Button>
          )
        }
      />
      <QueryState queries={[people, homes]}>
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
                  <Td label="Date of birth">
                    {ofsted ? '••••••' : formatDate(y.dateOfBirth)}
                  </Td>
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
                        onClick={() => setEditing(y)}
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
                  defaultValue={current?.homeId}
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
        {file && (
          <>
            {PROFILE_GROUPS.map((g) => (
              <section key={g.title} className="mb-5">
                <h3 className="mb-2 text-sm font-semibold">{g.title}</h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {g.fields.map((x) => (
                    <div key={x.key}>
                      <dt className="font-medium text-slate-800">{x.label}</dt>
                      <dd className="whitespace-pre-wrap text-slate-700">
                        {ofsted ? '••••••' : file[x.key] || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
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
