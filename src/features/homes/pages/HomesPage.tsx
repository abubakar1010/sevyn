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
  useHomeFields,
  useLabels,
} from '@/data/hooks'
import { DocumentsPanel } from '@/features/documents/DocumentsPanel'
import { CustomFieldInputs } from '@/features/homes/CustomFieldInputs'
import { readCustomValues } from '@/features/homes/customFields'
import { CustomFieldValues } from '@/features/homes/CustomFieldValues'
import { SettingsLink } from '@/features/settings/SettingsLink'
import { useCanEdit } from '@/lib/useCanEdit'
import type { Home, HomeInput, Unit } from '@/types'
import {
  buildComplianceItems,
  homeStatus,
} from '@/features/compliance/compliance'

type HomeEditing = Home | 'new' | null

type TextKey = Exclude<keyof HomeInput, 'approvedCapacity' | 'customFields'>
/** Built-in home fields; their names come from the company's label settings. */
interface HomeField {
  name: TextKey
  type?: string
  required?: boolean
  placeholder?: string
}

const HOME_FIELDS: HomeField[] = [
  { name: 'name', required: true },
  { name: 'address', required: true },
  { name: 'ofstedUrn', required: true },
  { name: 'phone', type: 'tel' },
  { name: 'outOfHoursPhone', type: 'tel' },
  { name: 'managerName' },
  { name: 'managerEmail', type: 'email' },
  { name: 'managerPhone', type: 'tel' },
  { name: 'laContact' },
  { name: 'ageRange', placeholder: 'e.g. 16-18' },
  { name: 'genderPermitted' },
]

/** Shown on a home's detail view, in this order, after the address. */
const DETAIL_FIELDS: (keyof HomeInput)[] = [
  'ofstedUrn',
  'approvedCapacity',
  'phone',
  'outOfHoursPhone',
  'managerName',
  'managerEmail',
  'managerPhone',
  'laContact',
  'ageRange',
  'genderPermitted',
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
  const homeFields = useHomeFields()
  const label = useLabels('homes')
  const unitWord = label('unit').toLowerCase()
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
          { audits: audits.data, homes: homes.data, homeFields },
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
      customFields: readCustomValues(homeFields, f),
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
          profile?.role === 'responsible_individual' && (
            <>
              <SettingsLink section="homes-naming">
                Customise names & categories
              </SettingsLink>
              <Button onClick={() => setHomeEditing('new')}>Add home</Button>
            </>
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
                        {label('ofstedUrn')} {h.ofstedUrn} ·{' '}
                        {label('approvedCapacity')} {h.approvedCapacity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RagBadge status={homeStatus(items, h.id)} />
                      {profile?.role === 'responsible_individual' && (
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
                      <li className="px-3 py-2 text-slate-600">
                        No {label('units').toLowerCase()} yet
                      </li>
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
                              aria-label={`Delete ${unitWord} ${u.name}`}
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
                      Add {unitWord}
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
              <Field key={x.name} label={label(x.name)}>
                {(p) => (
                  <Input
                    name={x.name}
                    type={x.type}
                    required={x.required}
                    placeholder={x.placeholder}
                    defaultValue={currentHome?.[x.name]}
                    {...p}
                  />
                )}
              </Field>
            ))}
            <Field label={label('approvedCapacity')}>
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
              <Field key={x.name} label={label(x.name)}>
                {(p) => (
                  <Input
                    name={x.name}
                    type={x.type}
                    placeholder={x.placeholder}
                    defaultValue={currentHome?.[x.name]}
                    {...p}
                  />
                )}
              </Field>
            ))}
            <CustomFieldInputs
              config={homeFields}
              values={currentHome?.customFields}
            />
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
            <h3 className="mb-2 text-sm font-semibold">
              {label('homeDetails')}
            </h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="font-medium text-slate-800">
                  {label('address')}
                </dt>
                <dd className="text-slate-700">{detail.address}</dd>
              </div>
              {DETAIL_FIELDS.map((key) => (
                <div key={key}>
                  <dt className="font-medium text-slate-800">{label(key)}</dt>
                  <dd className="text-slate-700">
                    {String(detail[key] ?? '') || '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <CustomFieldValues home={detail} config={homeFields} />
            <DocumentsPanel
              ownerType="home"
              ownerId={detail.id}
              homeId={detail.id}
              heading={label('documents')}
            />
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={unitDeleting !== null}
        title={`Delete ${unitWord}`}
        message={`Delete the ${unitWord} "${unitDeleting?.name}"? The deletion is recorded in the audit log.`}
        confirmLabel={`Delete ${unitWord}`}
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
        title={`Add ${unitWord}`}
      >
        <form onSubmit={submitUnit} className="flex flex-col gap-4">
          <Field label={`${label('unit')} name`}>
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
            Save {unitWord}
          </Button>
        </form>
      </Modal>
    </>
  )
}
