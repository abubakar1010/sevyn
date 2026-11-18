import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Field'
import { QueryState } from '@/components/ui/QueryState'
import { useHomes, useQuickLogs } from '@/data/hooks'
import { summariseRatings, type RatingTally } from './progress'
import { LOG_TAGS } from './tags'

const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
] as const

const DAY_MS = 86_400_000

/** Order is the scale itself: declined, no change, progressing. */
const PARTS = [
  {
    key: 'declined',
    label: 'Declined',
    color: 'var(--rating-declined)',
    mark: '↓',
  },
  {
    key: 'noChange',
    label: 'No change',
    color: 'var(--rating-none)',
    mark: '→',
  },
  {
    key: 'progressing',
    label: 'Progressing',
    color: 'var(--rating-progress)',
    mark: '↑',
  },
] as const

/** Headline figures read best-first: progressing, no change, declined. */
const HEADLINE = [...PARTS].reverse()

const percent = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100)

const describe = (t: RatingTally) =>
  `${t.progressing} progressing, ${t.noChange} no change, ${t.declined} declined`

/** Thin diverging bar: declined on the left, progressing on the right, 2px gaps between parts. */
function RatingBar({ label, tally }: { label: string; tally: RatingTally }) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${describe(tally)}`}
      className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
    >
      {PARTS.filter((p) => tally[p.key] > 0).map((p) => (
        <span
          key={p.key}
          title={`${p.label}: ${tally[p.key]} (${percent(tally[p.key], tally.total)}%)`}
          className="h-full min-w-1"
          style={{ flexGrow: tally[p.key], background: p.color }}
        />
      ))}
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-sm"
      style={{ background: color }}
    />
  )
}

/**
 * Dashboard summary of how young people are doing, from the progress ratings written
 * into Quick Logs. It counts ratings (not people), so it never names anyone.
 */
export function QuickLogAnalytics() {
  const logs = useQuickLogs()
  const homes = useHomes()
  const [days, setDays] = useState<number>(30)
  const [homeId, setHomeId] = useState('')
  const [now] = useState(() => Date.now())

  const since = now - days * DAY_MS
  const scoped = (logs.data ?? []).filter((l) => !homeId || l.homeId === homeId)
  const { overall, byArea } = summariseRatings(scoped, since, LOG_TAGS)

  return (
    <section aria-label="Quick log analytics" className="rating-root mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Quick log progress</h2>
          <p className="text-sm text-slate-600">
            How many ratings in daily logs showed progress, no change or
            decline.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(homes.data?.length ?? 0) > 1 && (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
              Home
              <Select
                value={homeId}
                onChange={(e) => setHomeId(e.target.value)}
                className="min-w-40"
              >
                <option value="">All homes</option>
                {homes.data?.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
            Period
            <Select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="min-w-40"
            >
              {PERIODS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      <QueryState queries={[logs]}>
        <Card>
          {overall.total === 0 ? (
            <p className="text-sm text-slate-600">
              No rated logs in this period. Rate each progress area when writing
              a log to build this chart.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-3">
                {HEADLINE.map((p) => (
                  <div key={p.key}>
                    <dt className="flex items-center gap-2 text-sm text-slate-600">
                      <Swatch color={p.color} />
                      {p.label}
                    </dt>
                    <dd className="font-display text-3xl font-semibold text-slate-900">
                      {overall[p.key]}
                      <span className="ml-1 text-sm font-normal text-slate-600">
                        {percent(overall[p.key], overall.total)}%
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-5 flex flex-col gap-3">
                {byArea.map((a) => (
                  <li
                    key={a.area}
                    className="grid items-center gap-1 sm:grid-cols-[11rem_1fr_auto] sm:gap-4"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      {a.area}
                    </span>
                    <RatingBar label={a.area} tally={a} />
                    <span className="text-sm whitespace-nowrap text-slate-600 tabular-nums">
                      {PARTS.map((p) => `${p.mark} ${a[p.key]}`).join('  ')}
                    </span>
                  </li>
                ))}
              </ul>

              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                {PARTS.map((p) => (
                  <li key={p.key} className="flex items-center gap-2">
                    <Swatch color={p.color} />
                    {p.mark} {p.label}
                  </li>
                ))}
              </ul>

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium">
                  View as table
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-1 pr-4 font-medium">Progress area</th>
                        {HEADLINE.map((p) => (
                          <th key={p.key} className="py-1 pr-4 font-medium">
                            {p.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byArea.map((a) => (
                        <tr key={a.area} className="border-t border-line">
                          <td className="py-1 pr-4">{a.area}</td>
                          {HEADLINE.map((p) => (
                            <td key={p.key} className="py-1 pr-4">
                              {a[p.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </Card>
      </QueryState>
    </section>
  )
}
