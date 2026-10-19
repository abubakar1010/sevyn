import { useState, type FormEvent } from 'react'
import { useAuth } from '@/app/useAuth'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import {
  useAddHome,
  useAddUnit,
  useHomes,
  useInterimMeasures,
  useStaff,
  useTrainingRecords,
  useUnits,
  useAmberDays,
} from '@/data/hooks'
import { useCanEdit } from '@/lib/useCanEdit'
import {
  buildComplianceItems,
  homeStatus,
} from '@/features/compliance/compliance'

export function HomesPage() {
  const { profile } = useAuth()
  const canEdit = useCanEdit()
  const homes = useHomes()
  const units = useUnits()
  const staff = useStaff()
  const training = useTrainingRecords()
  const measures = useInterimMeasures()
  const amberDays = useAmberDays()
  const addHome = useAddHome()
  const addUnit = useAddUnit()
  const [homeOpen, setHomeOpen] = useState(false)
  const [unitHome, setUnitHome] = useState<string | null>(null)

  const items =
    staff.data && training.data && measures.data
      ? buildComplianceItems(
          staff.data,
          training.data,
          measures.data,
          undefined,
          amberDays,
        )
      : []

  function submitHome(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    addHome.mutate(
      {
        name: String(f.get('name')).trim(),
        address: String(f.get('address')).trim(),
      },
      { onSuccess: () => setHomeOpen(false) },
    )
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
            <Button onClick={() => setHomeOpen(true)}>Add home</Button>
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
                      <h2 className="text-lg font-semibold">{h.name}</h2>
                      <p className="text-sm text-slate-600">{h.address}</p>
                    </div>
                    <RagBadge status={homeStatus(items, h.id)} />
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
                        <span className="text-slate-600">
                          Capacity {u.capacity}
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
        open={homeOpen}
        onClose={() => setHomeOpen(false)}
        title="Add home"
      >
        <form onSubmit={submitHome} className="flex flex-col gap-4">
          <Field label="Home name">
            {(p) => <Input name="name" required {...p} />}
          </Field>
          <Field label="Address">
            {(p) => <Input name="address" required {...p} />}
          </Field>
          <FormError error={addHome.error} />
          <Button type="submit" disabled={addHome.isPending}>
            Save home
          </Button>
        </form>
      </Modal>
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
