import { useState, type FormEvent } from 'react'
import { useAuth } from '@/app/useAuth'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import {
  useAddHome,
  useAddUnit,
  useDeleteUnit,
  useHomes,
  useInterimMeasures,
  useStaff,
  useTrainingRecords,
  useUnits,
  useUpdateHome,
  useAmberDays,
  useAudits,
} from '@/data/hooks'
import { DocumentsPanel } from '@/features/documents/DocumentsPanel'
import { useCanEdit } from '@/lib/useCanEdit'
import type { Home, HomeInput, Unit } from '@/types'
import {
  buildComplianceItems,
  homeStatus,
} from '@/features/compliance/compliance'

type HomeEditing = Home | 'new' | null

type TextKey = Exclude<keyof HomeInput, 'approvedCapacity'>
interface HomeField {
  name: TextKey
  label: string
  type?: string
  required?: boolean
}

const HOME_FIELDS: HomeField[] = [
  { name: 'name', label: 'Home name', required: true },
  { name: 'address', label: 'Address', required: true },
  { name: 'ofstedUrn', label: 'Ofsted URN', required: true },
  { name: 'phone', label: 'Home direct telephone', type: 'tel' },
  {
    name: 'outOfHoursPhone',
    label: 'Out-of-hours / on-call number',
    type: 'tel',
  },
  { name: 'managerName', label: 'Registered manager name' },
  { name: 'managerEmail', label: 'Registered manager email', type: 'email' },
  {
    name: 'managerPhone',
    label: 'Registered manager direct phone',
    type: 'tel',
  },
  { name: 'laContact', label: 'Local authority / LADO contact details' },
  { name: 'ageRange', label: 'Age range (e.g. 16-18)' },
  { name: 'genderPermitted', label: 'Gender permitted' },
]

const DETAIL_ROWS: [string, (h: Home) => string | number][] = [
  ['Ofsted URN', (h) => h.ofstedUrn],
  ['Approved capacity', (h) => h.approvedCapacity],
  ['Home telephone', (h) => h.phone],
  ['Out-of-hours number', (h) => h.outOfHoursPhone],
  ['Registered manager', (h) => h.managerName],
  ['Manager email', (h) => h.managerEmail],
  ['Manager phone', (h) => h.managerPhone],
  ['Local authority / LADO', (h) => h.laContact],
  ['Age range', (h) => h.ageRange],
  ['Gender permitted', (h) => h.genderPermitted],
]

export function HomesPage() {
  const { profile } = useAuth()
  const canEdit = useCanEdit()
  const homes = useHomes()
  const units = useUnits()
  const staff = useStaff()
  const training = useTrainingRecords()
  const measures = useInterimMeasures()
  const amberDays = useAmberDays()
  const audits = useAudits()
  const addHome = useAddHome()
  const addUnit = useAddUnit()
  const updateHome = useUpdateHome()
  const removeUnit = useDeleteUnit()
  const [homeEditing, setHomeEditing] = useState<HomeEditing>(null)
  const [unitDeleting, setUnitDeleting] = useState<Unit | null>(null)
  const currentHome = homeEditing && homeEditing !== 'new' ? homeEditing : null
  const [unitHome, setUnitHome] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = homes.data?.find((h) => h.id === detailId) ?? null

  const items =
    staff.data && training.data && measures.data
      ? buildComplianceItems(
          staff.data,
          training.data,
          measures.data,
          undefined,
          amberDays,
          { audits: audits.data },
        )
      : []

  function submitHome(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const text = (k: string) => String(f.get(k) ?? '').trim()
    const fields = {
      ...(Object.fromEntries(
        HOME_FIELDS.map((x) => [x.name, text(x.name)]),
      ) as Record<TextKey, string>),
      approvedCapacity: Number(f.get('approvedCapacity')),
    }
    const done = { onSuccess: () => setHomeEditing(null) }
    if (currentHome) updateHome.mutate({ id: currentHome.id, ...fields }, done)
    else addHome.mutate(fields, done)
  }

  function submitUnit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    addUnit.mutate(
      {
        homeId: unitHome!,
        name: String(f.get('name')).trim(),
        capacity: Number(f.get('capacity')),
      },
      { onSuccess: () => setUnitHome(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Homes & units"
        description="Residential homes, their units and current compliance status."
        actions={
          profile?.role === 'admin' && (
            <Button onClick={() => setHomeEditing('new')}>Add home</Button>
          )
        }
      />
      <QueryState queries={[homes, units, staff, training, measures]}>
        {homes.data?.length === 0 ? (
          <EmptyState title="No homes assigned" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {homes.data?.map((h) => {
              const homeUnits =
                units.data?.filter((u) => u.homeId === h.id) ?? []
              return (
                <Card key={h.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => setDetailId(h.id)}
                        >
                          {h.name}
                        </button>
                      </h2>
                      <p className="text-sm text-slate-600">{h.address}</p>
                      <p className="text-sm text-slate-600">
                        Ofsted URN {h.ofstedUrn} � {h.approvedCapacity} beds
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RagBadge status={homeStatus(items, h.id)} />
                      {profile?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${h.name}`}
                          onClick={() => setHomeEditing(h)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    {staff.data?.filter((s) => s.homeId === h.id).length} staff
                  </p>
                  <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                    {homeUnits.length === 0 && (
                      <li className="px-3 py-2 text-slate-600">No units yet</li>
                    )}
                    {homeUnits.map((u) => (
                      <li key={u.id} className="flex justify-between px-3 py-2">
                        <span>{u.name}</span>
                        <span className="flex items-center gap-2 text-slate-600">
                          Capacity {u.capacity}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete unit ${u.name}`}
                              onClick={() => setUnitDeleting(u)}
                            >
                              Delete
                            </Button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {canEdit && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="self-start"
                      onClick={() => setUnitHome(h.id)}
                    >
                      Add unit
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </QueryState>

      <Modal
        open={homeEditing !== null}
        onClose={() => setHomeEditing(null)}
        title={currentHome ? 'Edit home' : 'Add home'}
      >
        {homeEditing !== null && (
          <form
            key={currentHome?.id ?? 'new'}
            onSubmit={submitHome}
            className="flex flex-col gap-4"
          >
            {HOME_FIELDS.slice(0, 3).map((x) => (
              <Field key={x.name} label={x.label}>
                {(p) => (
                  <Input
                    name={x.name}
                    type={x.type}
                    required={x.required}
                    defaultValue={currentHome?.[x.name]}
                    {...p}
                  />
                )}
              </Field>
            ))}
            <Field label="Approved capacity / bed count">
              {(p) => (
                <Input
                  name="approvedCapacity"
                  type="number"
                  min={1}
                  required
                  defaultValue={currentHome?.approvedCapacity ?? 1}
                  {...p}
                />
              )}
            </Field>
            {HOME_FIELDS.slice(3).map((x) => (
              <Field key={x.name} label={x.label}>
                {(p) => (
                  <Input
                    name={x.name}
                    type={x.type}
                    defaultValue={currentHome?.[x.name]}
                    {...p}
                  />
                )}
              </Field>
            ))}
            <FormError error={currentHome ? updateHome.error : addHome.error} />
            <Button
              type="submit"
              disabled={addHome.isPending || updateHome.isPending}
            >
              Save home
            </Button>
          </form>
        )}
      </Modal>
      <Modal
        open={detail !== null}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? 'Home'}
      >
        {detail && (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="font-medium text-slate-800">Address</dt>
                <dd className="text-slate-700">{detail.address}</dd>
              </div>
              {DETAIL_ROWS.map(([label, get]) => (
                <div key={label}>
                  <dt className="font-medium text-slate-800">{label}</dt>
                  <dd className="text-slate-700">{get(detail) || '�'}</dd>
                </div>
              ))}
            </dl>
            <DocumentsPanel
              ownerType="home"
              ownerId={detail.id}
              homeId={detail.id}
            />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={unitDeleting !== null}
        title="Delete unit"
        message={`Delete the unit "${unitDeleting?.name}"? The deletion is recorded in the audit log.`}
        confirmLabel="Delete unit"
        pending={removeUnit.isPending}
        error={removeUnit.error}
        onClose={() => setUnitDeleting(null)}
        onConfirm={() =>
          removeUnit.mutate(
            { id: unitDeleting!.id },
            { onSuccess: () => setUnitDeleting(null) },
          )
        }
      />
      <Modal
        open={unitHome !== null}
        onClose={() => setUnitHome(null)}
        title="Add unit"
      >
        <form onSubmit={submitUnit} className="flex flex-col gap-4">
          <Field label="Unit name">
            {(p) => <Input name="name" required {...p} />}
          </Field>
          <Field label="Capacity">
            {(p) => (
              <Input
                name="capacity"
                type="number"
                min={1}
                required
                defaultValue={2}
                {...p}
              />
            )}
          </Field>
          <FormError error={addUnit.error} />
          <Button type="submit" disabled={addUnit.isPending}>
            Save unit
          </Button>
        </form>
      </Modal>
    </>
  )
}
