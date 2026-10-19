import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import { useHomes, useSaveYoungPerson, useYoungPeople } from '@/data/hooks'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { YoungPerson } from '@/types'
import { youngPersonName } from '../display'

type Editing = YoungPerson | 'new' | null

export function YoungPeoplePage() {
  const canEdit = useCanEdit()
  const { enabled: ofsted } = useOfstedMode()
  const people = useYoungPeople()
  const homes = useHomes()
  const save = useSaveYoungPerson()
  const [editing, setEditing] = useState<Editing>(null)
  const current = editing && editing !== 'new' ? editing : null

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
                    {youngPersonName(y, ofsted)}
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
            <FormError error={save.error} />
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
          </form>
        )}
      </Modal>
    </>
  )
}
