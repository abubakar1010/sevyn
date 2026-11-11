import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormError } from '@/components/ui/FormError'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import { useArchiveStaff, useHomes, useSaveStaff, useStaff } from '@/data/hooks'
import { useCanEdit } from '@/lib/useCanEdit'
import { DateStatus } from '@/features/compliance/DateStatus'
import { useOfstedMode } from '@/features/ofsted-mode/useOfstedMode'
import type { StaffMember } from '@/types'
import { DocumentsPanel } from '@/features/documents/DocumentsPanel'
import { RagBadge } from '@/components/ui/RagBadge'

type Editing = StaffMember | 'new' | null

export function StaffPage() {
  const canEdit = useCanEdit()
  const { enabled: ofsted } = useOfstedMode()
  const staff = useStaff()
  const homes = useHomes()
  const save = useSaveStaff()
  const archive = useArchiveStaff()
  const [archiving, setArchiving] = useState<StaffMember | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<'all' | 'ready' | 'not'>('all')
  const file = staff.data?.find((m) => m.id === fileId) ?? null
  const readyCount = staff.data?.filter((m) => m.compliantToWork).length ?? 0
  const shown =
    staff.data?.filter(
      (m) =>
        readiness === 'all' ||
        (readiness === 'ready' ? m.compliantToWork : !m.compliantToWork),
    ) ?? []
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
        compliantToWork: f.get('compliantToWork') === 'yes',
        complianceNote: String(f.get('complianceNote') ?? '').trim(),
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
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <p role="status" className="text-sm text-slate-700">
                <span className="font-semibold">{readyCount}</span> of{' '}
                {staff.data?.length} staff ready to work
              </p>
              <div className="w-full max-w-48">
                <Field label="Show">
                  {(p) => (
                    <Select
                      value={readiness}
                      onChange={(e) =>
                        setReadiness(e.target.value as typeof readiness)
                      }
                      {...p}
                    >
                      <option value="all">All staff</option>
                      <option value="ready">Ready to work</option>
                      <option value="not">Not ready</option>
                    </Select>
                  )}
                </Field>
              </div>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Home</Th>
                  <Th>DBS recheck</Th>
                  <Th>Safeguarding training</Th>
                  <Th>Compliant to work</Th>
                  <Th>Address</Th>
                  {canEdit && (
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id}>
                    <Td label="Name" className="font-medium">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        aria-label={`Open staff file for ${s.fullName}`}
                        onClick={() => setFileId(s.id)}
                      >
                        {s.fullName}
                      </button>
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
                    <Td label="Compliant to work">
                      <div className="flex flex-col items-start gap-1">
                        <RagBadge
                          status={s.compliantToWork ? 'green' : 'red'}
                          label={s.compliantToWork ? 'Yes' : 'No'}
                        />
                        {!s.compliantToWork && s.complianceNote && (
                          <span className="max-w-48 text-xs whitespace-normal text-slate-600">
                            {s.complianceNote}
                          </span>
                        )}
                      </div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Archive ${s.fullName}`}
                          onClick={() => setArchiving(s)}
                        >
                          Archive
                        </Button>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
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
            <Field
              label="Compliant to work"
              hint="Yes once this staff member has everything your company requires on their file."
            >
              {(p) => (
                <Select
                  name="compliantToWork"
                  defaultValue={current?.compliantToWork ? 'yes' : 'no'}
                  {...p}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              )}
            </Field>
            <Field label="Compliance note" hint="What is missing, if anything.">
              {(p) => (
                <Textarea
                  name="complianceNote"
                  defaultValue={current?.complianceNote}
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
      <Modal
        open={file !== null}
        onClose={() => setFileId(null)}
        title={file ? `Staff file: ${file.fullName}` : 'Staff file'}
      >
        {file && (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-800">Role</dt>
                <dd className="text-slate-700">{file.jobTitle}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Home</dt>
                <dd className="text-slate-700">
                  {homes.data?.find((h) => h.id === file.homeId)?.name}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">DBS recheck</dt>
                <dd>
                  <DateStatus date={file.dbsRecheckDate} />
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">
                  Safeguarding training
                </dt>
                <dd>
                  <DateStatus date={file.safeguardingExpiry} />
                </dd>
              </div>
            </dl>
            <DocumentsPanel
              ownerType="staff"
              ownerId={file.id}
              homeId={file.homeId}
            />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={archiving !== null}
        title="Archive staff member"
        message={`Archive ${archiving?.fullName}? They will be removed from active lists and compliance figures. The change is recorded in the audit log.`}
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
