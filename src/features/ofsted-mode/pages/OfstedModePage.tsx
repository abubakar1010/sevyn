import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OfstedToggle } from '@/app/OfstedToggle'
import { HOME_BY_ROLE } from '@/app/homeByRole'
import { useAuth } from '@/app/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useAmberDays,
  useAudits,
  useDocuments,
  useHomeFields,
  useHomes,
  useInterimMeasures,
  usePolicies,
  useQuickLogs,
  useStaff,
  useTrainingRecords,
  useYoungPeople,
} from '@/data/hooks'
import { buildComplianceItems } from '@/features/compliance/compliance'
import { CustomFieldValues } from '@/features/homes/CustomFieldValues'
import { nameMasker } from '@/features/young-people/qualityStandards'
import { YoungPersonInspectionFile } from '@/features/young-people/YoungPersonInspectionFile'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { initialsOf } from '@/lib/roles'
import { buildInspectionSummary, RATINGS_WINDOW_DAYS } from '../inspection'
import { useOfstedMode } from '../useOfstedMode'

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`

function Fact({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-800">{label}</dt>
      <dd className="text-slate-700">{value || '—'}</dd>
    </div>
  )
}

/**
 * Inspection view for the Responsible Individual: pick a home and see everything an
 * inspector asks about it on one page, jump to the evidence, and print it as a report.
 * The Ofsted Mode switch masks personal details while the page is on show.
 */
export function OfstedModePage() {
  const { profile } = useAuth()
  const { enabled: masked } = useOfstedMode()
  const homes = useHomes()
  const staff = useStaff()
  const training = useTrainingRecords()
  const measures = useInterimMeasures()
  const policies = usePolicies()
  const audits = useAudits()
  const youngPeople = useYoungPeople()
  const documents = useDocuments()
  const logs = useQuickLogs()
  const amberDays = useAmberDays()
  const homeFields = useHomeFields()
  const [selected, setSelected] = useState('')
  const [reportDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [openFiles, setOpenFiles] = useState<Set<string>>(() => new Set())
  const toggleFile = (id: string) =>
    setOpenFiles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  // Hides every young person's name and initials staff names in free text.
  const maskNames = masked
    ? nameMasker({ people: youngPeople.data ?? [], staff: staff.data ?? [] })
    : (t: string) => t

  const queries = [
    homes,
    staff,
    training,
    measures,
    policies,
    audits,
    youngPeople,
    documents,
    logs,
  ]
  const base = profile ? HOME_BY_ROLE[profile.role] : ''
  const home = homes.data?.find((h) => h.id === selected) ?? homes.data?.[0]

  let summary = null
  if (
    home &&
    staff.data &&
    training.data &&
    measures.data &&
    policies.data &&
    audits.data &&
    youngPeople.data &&
    documents.data &&
    logs.data
  ) {
    summary = buildInspectionSummary({
      home,
      items: buildComplianceItems(
        staff.data,
        training.data,
        measures.data,
        undefined,
        amberDays,
        {
          policies: policies.data,
          audits: audits.data,
          homes: homes.data,
          homeFields,
        },
      ),
      staff: staff.data,
      youngPeople: youngPeople.data,
      audits: audits.data,
      policies: policies.data,
      documents: documents.data,
      logs: logs.data,
      amberDays,
    })
  }

  const links = summary &&
    home && [
      {
        to: `${base}/staff`,
        title: 'Staff files',
        detail: `${summary.staff.ready} of ${summary.staff.total} ready to work`,
      },
      {
        to: `${base}/training`,
        title: 'Training matrix',
        detail: 'Certificates and expiry dates',
      },
      {
        to: `${base}/young-people`,
        title: 'Young people',
        detail: `${summary.youngPeople.count} of ${plural(summary.youngPeople.capacity, 'place')} in use`,
      },
      {
        to: `${base}/audits`,
        title: 'Audits',
        detail: `${plural(summary.audits.openActions.length, 'open action')}`,
      },
      {
        to: `${base}/policies`,
        title: 'Policies',
        detail: `${summary.policies.overdue} overdue, ${summary.policies.dueSoon} due soon`,
      },
      {
        to: `${base}/interim-measures`,
        title: 'Interim measures',
        detail: 'Notes for items out of date',
      },
      {
        to: `${base}/audit-log`,
        title: 'Audit log',
        detail: 'Who changed what, and when',
      },
    ]

  return (
    <div className="stagger">
      <PageHeader
        title="Ofsted Mode"
        description="Everything an inspector asks about a home, in one place, with a printable report."
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <OfstedToggle />
            <Button variant="secondary" onClick={() => window.print()}>
              Print or save as PDF
            </Button>
          </div>
        }
      />

      {!masked && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-line bg-surface p-3 text-sm text-slate-700 print:hidden"
        >
          Names are visible. Turn Ofsted Mode on before you share your screen or
          print: young people then appear by initials, other young people’s
          names and staff addresses are hidden, and staff appear by initials.
          Everything else stays on show.
        </p>
      )}

      <QueryState queries={queries}>
        {!home || !summary || !links ? (
          <EmptyState title="No homes to show" />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-800 print:hidden">
                Home
                <Select
                  value={home.id}
                  onChange={(e) => setSelected(e.target.value)}
                  className="min-w-56"
                >
                  {homes.data?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
              </label>
              <p className="hidden text-sm text-slate-600 print:block">
                Inspection report for {home.name} · {formatDate(reportDate)}
              </p>
            </div>

            <section aria-label="Inspection navigator" className="print:hidden">
              <h2 className="mb-3 text-lg font-semibold">Go to the evidence</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="block h-full">
                      <Card interactive className="h-full">
                        <p className="font-medium text-primary-700 dark:text-primary-200">
                          {l.title}
                        </p>
                        <p className="text-sm text-slate-600">{l.detail}</p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Home overview" className="mt-8">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-lg font-semibold">{home.name}</h2>
                <RagBadge status={summary.rag} />
              </div>
              <Card>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Fact label="Ofsted URN" value={home.ofstedUrn} />
                  <Fact label="Address" value={home.address} />
                  <Fact
                    label="Approved capacity"
                    value={String(home.approvedCapacity)}
                  />
                  <Fact label="Age range" value={home.ageRange} />
                  <Fact label="Gender permitted" value={home.genderPermitted} />
                  <Fact label="Registered manager" value={home.managerName} />
                  <Fact label="Manager email" value={home.managerEmail} />
                  <Fact label="Manager phone" value={home.managerPhone} />
                  <Fact label="Home phone" value={home.phone} />
                  <Fact label="Out of hours" value={home.outOfHoursPhone} />
                  <Fact label="Local authority / LADO" value={home.laContact} />
                </dl>
                <CustomFieldValues home={home} config={homeFields} />
              </Card>
            </section>

            <section aria-label="Position at a glance" className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">At a glance</h2>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <dt className="text-sm text-slate-600">
                    Staff ready to work
                  </dt>
                  <dd className="font-display text-3xl font-semibold">
                    {summary.staff.ready}
                    <span className="text-lg font-normal text-slate-600">
                      {' '}
                      of {summary.staff.total}
                    </span>
                  </dd>
                </Card>
                <Card>
                  <dt className="text-sm text-slate-600">
                    Young people in the home
                  </dt>
                  <dd className="font-display text-3xl font-semibold">
                    {summary.youngPeople.count}
                    <span className="text-lg font-normal text-slate-600">
                      {' '}
                      of {summary.youngPeople.capacity} places
                    </span>
                  </dd>
                </Card>
                <Card>
                  <dt className="text-sm text-slate-600">Open audit actions</dt>
                  <dd className="font-display text-3xl font-semibold">
                    {summary.audits.openActions.length}
                  </dd>
                </Card>
                <Card>
                  <dt className="text-sm text-slate-600">
                    Policies overdue or due soon
                  </dt>
                  <dd className="font-display text-3xl font-semibold">
                    {summary.policies.overdue + summary.policies.dueSoon}
                    <span className="text-lg font-normal text-slate-600">
                      {' '}
                      of {summary.policies.total}
                    </span>
                  </dd>
                </Card>
              </dl>
            </section>

            <section
              aria-label="Young people's records by Quality Standard"
              className="mt-8"
            >
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Young people’s records by Quality Standard
                  </h2>
                  <p className="text-sm text-slate-600">
                    Placement, statutory contacts, care and risk plans,
                    safeguarding and incidents, and daily support and progress
                    for each young person living in {home.name}.
                  </p>
                </div>
                {summary.youngPeople.list.length > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="print:hidden"
                    onClick={() =>
                      setOpenFiles((prev) =>
                        prev.size === summary.youngPeople.list.length
                          ? new Set()
                          : new Set(summary.youngPeople.list.map((y) => y.id)),
                      )
                    }
                  >
                    {openFiles.size === summary.youngPeople.list.length
                      ? 'Collapse all'
                      : 'Expand all'}
                  </Button>
                )}
              </div>
              {summary.youngPeople.list.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No young people are living in this home.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {summary.youngPeople.list.map((y) => {
                    const open = openFiles.has(y.id)
                    const name = masked ? y.initials : y.fullName
                    return (
                      <li key={y.id}>
                        <Card className="break-inside-avoid-page">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={`yp-pack-${y.id}`}
                            onClick={() => toggleFile(y.id)}
                            className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                          >
                            <span>
                              <span className="font-semibold">{name}</span>
                              <span className="block text-sm text-slate-600">
                                Moved in{' '}
                                {y.moveInDate
                                  ? formatDate(y.moveInDate)
                                  : 'date not recorded'}
                                {y.restricted && ' · Restricted file'}
                              </span>
                            </span>
                            <span
                              aria-hidden
                              className="text-sm font-medium text-primary-700 print:hidden dark:text-primary-200"
                            >
                              {open ? 'Hide records' : 'Show records'}
                            </span>
                          </button>
                          <div
                            id={`yp-pack-${y.id}`}
                            className={cn(
                              'mt-4',
                              open ? 'block' : 'hidden print:block',
                            )}
                          >
                            <YoungPersonInspectionFile
                              yp={y}
                              masked={masked}
                              showRatings={false}
                            />
                          </div>
                        </Card>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section aria-label="Outstanding items" className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Outstanding items</h2>
              {summary.outstanding.length === 0 ? (
                <EmptyState
                  title="Nothing outstanding"
                  description="Every compliance item for this home is green."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Status</Th>
                      <Th>Item</Th>
                      <Th>Person</Th>
                      <Th>Due</Th>
                      <Th>Interim measure</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.outstanding.map((i) => (
                      <tr key={i.key}>
                        <Td label="Status">
                          <RagBadge status={i.status} />
                        </Td>
                        <Td label="Item">{i.label}</Td>
                        <Td label="Person">{maskNames(i.subject)}</Td>
                        <Td label="Due">{formatDate(i.due)}</Td>
                        <Td
                          label="Interim measure"
                          className="max-w-xs whitespace-normal"
                        >
                          {i.interimMeasure?.note ??
                            (i.status === 'red' ? 'Note required' : '—')}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </section>

            <section aria-label="Open audit actions" className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Open audit actions</h2>
              {summary.audits.openActions.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No open actions from audits.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                  {summary.audits.openActions.map((a) => (
                    <li key={a.id} className="px-3 py-2">
                      <span className="font-medium">{a.title}</span>
                      <span className="block text-slate-700">
                        {a.requiredAction}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Staff not yet ready to work" className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">
                Staff not yet ready to work
              </h2>
              {summary.staff.notReady.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Every staff member has met the requirements.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                  {summary.staff.notReady.map((s) => (
                    <li key={s.id} className="px-3 py-2">
                      <span className="font-medium">
                        {masked ? initialsOf(s.fullName) : s.fullName}
                      </span>
                      <span className="block text-slate-700">
                        {maskNames(s.complianceNote) ||
                          'Requirements outstanding'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Documents held" className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">
                Documents held on the home
              </h2>
              {summary.documents.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No documents uploaded to this home yet.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                  {summary.documents.map((d) => (
                    <li
                      key={d.category}
                      className="flex justify-between px-3 py-2"
                    >
                      <span>{d.category}</span>
                      <span className="font-medium">{d.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Progress ratings" className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">
                Young people’s progress
              </h2>
              <p className="text-sm text-slate-700">
                {summary.ratings.overall.total === 0
                  ? `No rated quick logs in the last ${RATINGS_WINDOW_DAYS} days.`
                  : `Ratings from quick logs in the last ${RATINGS_WINDOW_DAYS} days: ${summary.ratings.overall.progressing} progressing, ${summary.ratings.overall.noChange} no change, ${summary.ratings.overall.declined} declined.`}
              </p>
            </section>
          </>
        )}
      </QueryState>
    </div>
  )
}
