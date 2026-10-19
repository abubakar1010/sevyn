import { useAuth } from '@/app/useAuth'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useHomes,
  useInterimMeasures,
  useStaff,
  useTrainingRecords,
  useAmberDays,
} from '@/data/hooks'
import { formatDate } from '@/lib/format'
import type { Rag } from '@/types'
import { buildComplianceItems, countByStatus, homeStatus } from '../compliance'
import { ScoreHero } from '../ScoreHero'
import { StatTile } from '../StatTile'

const ORDER: Rag[] = ['red', 'amber', 'green']

export function CompliancePage() {
  const { profile } = useAuth()
  const homes = useHomes()
  const staff = useStaff()
  const training = useTrainingRecords()
  const measures = useInterimMeasures()
  const amberDays = useAmberDays()

  if (
    homes.isPending ||
    staff.isPending ||
    training.isPending ||
    measures.isPending
  ) {
    return <p role="status">Loading compliance…</p>
  }
  if (!homes.data || !staff.data || !training.data || !measures.data) {
    return <EmptyState title="Could not load compliance data" />
  }

  const items = buildComplianceItems(
    staff.data,
    training.data,
    measures.data,
    undefined,
    amberDays,
  )
  const counts = countByStatus(items)
  const total = counts.red + counts.amber + counts.green
  const percent = total === 0 ? 100 : Math.round((counts.green / total) * 100)
  const outstanding = items
    .filter((i) => i.status !== 'green')
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))

  return (
    <div className="stagger">
      <PageHeader
        title="Compliance dashboard"
        description="Live status from staff DBS, safeguarding and training dates."
      />
      <ScoreHero
        firstName={profile?.fullName.split(' ')[0] ?? ''}
        percent={percent}
        red={counts.red}
        amber={counts.amber}
      />

      <section aria-label="Summary" className="grid grid-cols-3 gap-3">
        {ORDER.map((s) => (
          <StatTile key={s} status={s} count={counts[s]} />
        ))}
      </section>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Homes</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {homes.data.map((h) => (
          <Card
            key={h.id}
            interactive
            className="flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium">{h.name}</p>
              <p className="text-sm text-slate-600">
                {
                  items.filter((i) => i.homeId === h.id && i.status !== 'green')
                    .length
                }{' '}
                outstanding
              </p>
            </div>
            <RagBadge status={homeStatus(items, h.id)} />
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Outstanding actions</h2>
      {outstanding.length === 0 ? (
        <EmptyState
          title="Nothing outstanding"
          description="All compliance items are green."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Status</Th>
              <Th>Item</Th>
              <Th>Person</Th>
              <Th>Home</Th>
              <Th>Due</Th>
              <Th>Interim measure</Th>
            </tr>
          </thead>
          <tbody>
            {outstanding.map((i) => (
              <tr key={i.key}>
                <Td label="Status">
                  <RagBadge status={i.status} />
                </Td>
                <Td label="Item">{i.label}</Td>
                <Td label="Person">{i.subject}</Td>
                <Td label="Home">
                  {homes.data.find((h) => h.id === i.homeId)?.name}
                </Td>
                <Td label="Due">{formatDate(i.due)}</Td>
                <Td
                  label="Interim measure"
                  className="max-w-xs whitespace-normal"
                >
                  {i.interimMeasure ? (
                    i.interimMeasure.note
                  ) : i.status === 'red' ? (
                    <span className="font-medium text-red-700">
                      Note required
                    </span>
                  ) : (
                    '—'
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
