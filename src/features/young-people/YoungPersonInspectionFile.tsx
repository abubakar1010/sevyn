import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { QueryState } from '@/components/ui/QueryState'
import {
  useDocuments,
  useHomes,
  useQuickLogs,
  useSettings,
  useStaff,
  useUnits,
  useYoungPeople,
} from '@/data/hooks'
import { DEFAULT_YOUNG_PERSON_CATEGORY_GROUPS } from '@/features/documents/categories'
import { YoungPersonRatings } from '@/features/quick-logs/QuickLogAnalytics'
import { formatDate } from '@/lib/format'
import type { YoungPerson } from '@/types'
import { buildYoungPersonPack, nameMasker } from './qualityStandards'

const DAY_MS = 86_400_000
/** Quick logs shown in the inspection file cover this many days. */
export const PACK_LOG_DAYS = 90

/**
 * One young person's records grouped under the Quality Standards, as an inspector
 * reads them. With `masked` on, the young person appears by initials, other young
 * people's names are hidden and staff keep their full names; everything else is shown.
 */
export function YoungPersonInspectionFile({
  yp,
  masked,
  showRatings = true,
}: {
  yp: YoungPerson
  masked: boolean
  /** The ratings chart has its own period picker; leave it out of printed packs. */
  showRatings?: boolean
}) {
  const homes = useHomes()
  const units = useUnits()
  const documents = useDocuments()
  const logs = useQuickLogs()
  const staff = useStaff()
  const people = useYoungPeople()
  const settings = useSettings()
  const [since] = useState(() => Date.now() - PACK_LOG_DAYS * DAY_MS)

  const staffList = staff.data ?? []
  const mask = masked
    ? nameMasker({ selfId: yp.id, people: people.data ?? [] })
    : (t: string) => t
  const author = (id: string) =>
    staffList.find((s) => s.id === id)?.fullName ?? 'Staff member'

  const pack = buildYoungPersonPack({
    yp,
    home: homes.data?.find((h) => h.id === yp.homeId),
    unit: units.data?.find((u) => u.id === yp.unitId),
    documents: documents.data ?? [],
    logs: logs.data ?? [],
    categoryGroups:
      settings.data?.youngPersonCategoryGroups ??
      DEFAULT_YOUNG_PERSON_CATEGORY_GROUPS,
    mask,
    logsSince: since,
  })

  return (
    <QueryState queries={[homes, units, documents, logs, people, settings]}>
      <div className="flex flex-col gap-4">
        {pack.map((g) => (
          <section
            key={g.id}
            aria-label={g.title}
            className="break-inside-avoid rounded-lg border border-line p-4"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">{g.title}</h4>
              {g.standard && <Badge tone="info">{g.standard}</Badge>}
            </div>
            <p className="mb-3 text-sm text-slate-600">{g.description}</p>

            {g.facts.length > 0 && (
              <dl className="mb-3 grid gap-3 text-sm sm:grid-cols-2">
                {g.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="font-medium text-slate-800">{f.label}</dt>
                    <dd className="whitespace-pre-wrap text-slate-700">
                      {f.value || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {(g.documents.length > 0 || g.id !== 'placement') && (
              <div className="mb-3">
                <p className="mb-1 text-sm font-medium text-slate-800">
                  Documents
                </p>
                {g.documents.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No documents filed in this group.
                  </p>
                ) : (
                  <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                    {g.documents.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <span>
                          <span className="font-medium">{d.title}</span>
                          <span className="block text-slate-600">
                            {d.category} · uploaded {formatDate(d.uploadedAt)}
                          </span>
                        </span>
                        {d.expiresOn && (
                          <Badge>Expires {formatDate(d.expiresOn)}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {g.id === 'progress' && (
              <>
                <p className="mb-1 text-sm font-medium text-slate-800">
                  Quick logs, last {PACK_LOG_DAYS} days
                </p>
                {g.logs.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No quick logs in the last {PACK_LOG_DAYS} days.
                  </p>
                ) : (
                  <ul className="mb-3 divide-y divide-line rounded-lg border border-line text-sm">
                    {g.logs.map((l) => (
                      <li key={l.id} className="px-3 py-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {formatDate(l.occurredAt)}
                          </span>
                          {l.tags.map((t) => (
                            <Badge key={t}>{t}</Badge>
                          ))}
                          <span className="text-slate-600">
                            by {author(l.authorId)}
                          </span>
                        </span>
                        {l.note && (
                          <span className="mt-1 block whitespace-pre-wrap text-slate-700">
                            {l.note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {showRatings && (
                  <div className="print:hidden">
                    <YoungPersonRatings youngPersonId={yp.id} />
                  </div>
                )}
              </>
            )}
          </section>
        ))}
      </div>
    </QueryState>
  )
}
