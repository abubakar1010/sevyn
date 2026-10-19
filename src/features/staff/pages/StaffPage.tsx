import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import { useHomes, useSaveStaff, useStaff } from '@/data/hooks'
import { useCanEdit } from '@/lib/useCanEdit'
import { DateStatus } from '@/features/compliance/DateStatus'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import type { StaffMember } from '@/types'

type Editing = StaffMember | 'new' | null

export function StaffPage() {
  const canEdit = useCanEdit()
  const { enabled: ofsted } = useOfstedMode()
  const staff = useStaff()
  const homes = useHomes()
  const save = useSaveStaff()
  const [editing, setEditing] = useState<Editing>(null)
  const current = editing && editing !== 'new' ? editing : null

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const date = (k: string) => String(f.get(k) || '') || null
    save.mutate(
      {
        id: current?.id,
        homeId: String(f.get('homeId')),
        fullName: String(f.get('fullName')).trim(),
        jobTitle: String(f.get('jobTitle')).trim(),
        address: String(f.get('address')).trim(),
        dbsRecheckDate: date('dbs'),
        safeguardingExpiry: date('safeguarding'),
      },
      { onSuccess: () => setEditing(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Staff"
        description="Staff profiles with DBS recheck and safeguarding training status."
        actions={
          canEdit && (
            <Button onClick={() => setEditing('new')}>Add staff member</Button>
          )
        }
      />
      <QueryState queries={[staff, homes]}>
        {staff.data?.length === 0 ? (
          <EmptyState title="No staff yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Home</Th>
                <Th>DBS recheck</Th>
                <Th>Safeguarding training</Th>
                <Th>Address</Th>
                {canEdit && (
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                )}
              </tr>
            </thead>
            <tbody>
              {staff.data?.map((s) => (
                <tr key={s.id}>
                  <Td label="Name" className="font-medium">
                    {s.fullName}
                  </Td>
                  <Td label="Role">{s.jobTitle}</Td>
                  <Td label="Home">
                    {homes.data?.find((h) => h.id === s.homeId)?.name}
                  </Td>
                  <Td label="DBS recheck">
                    <DateStatus date={s.dbsRecheckDate} />
                  </Td>
                  <Td label="Safeguarding training">
                    <DateStatus date={s.safeguardingExpiry} />
                  </Td>
                  <Td label="Address">{ofsted ? '••••••••' : s.address}</Td>
                  {canEdit && (
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${s.fullName}`}
                        onClick={() => setEditing(s)}
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
        title={current ? 'Edit staff member' : 'Add staff member'}
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
            <Field label="Job title">
              {(p) => (
                <Input
                  name="jobTitle"
                  required
                  defaultValue={current?.jobTitle ?? 'Support Worker'}
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
            <Field label="Address">
              {(p) => (
                <Input name="address" defaultValue={current?.address} {...p} />
              )}
            </Field>
            <Field label="DBS recheck date">
              {(p) => (
                <Input
                  name="dbs"
                  type="date"
                  defaultValue={current?.dbsRecheckDate ?? ''}
                  {...p}
                />
              )}
            </Field>
            <Field label="Safeguarding training expiry">
              {(p) => (
                <Input
                  name="safeguarding"
                  type="date"
                  defaultValue={current?.safeguardingExpiry ?? ''}
                  {...p}
                />
              )}
            </Field>
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
