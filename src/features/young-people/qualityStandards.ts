import { formatDate } from '@/lib/format'
import { initialsOf } from '@/lib/roles'
import type {
  DocumentRecord,
  Home,
  QualityStandardGroupId,
  QuickLog,
  StaffMember,
  Unit,
  YoungPerson,
  YoungPersonProfile,
} from '@/types'
import { PROFILE_GROUPS } from './profileFields'

export interface QualityStandardGroup {
  id: QualityStandardGroupId
  title: string
  /** The Quality Standard the evidence sits under. */
  standard: string
  description: string
  /** Profile details shown in this group, in order. */
  fields: (keyof YoungPersonProfile)[]
}

/**
 * How a young person's records are laid out for an inspector. The order follows the
 * client's inspection pack: placement, then statutory contacts, plans, safeguarding,
 * and day-to-day support.
 */
export const QS_GROUPS: QualityStandardGroup[] = [
  {
    id: 'placement',
    title: 'Placement',
    standard: 'Accommodation standard',
    description: 'Move-in date, home and unit.',
    fields: [],
  },
  {
    id: 'contacts',
    title: 'Placing LA & statutory contacts',
    standard: 'Support standard',
    description: 'Social worker, Personal Adviser, IRO and other contacts.',
    fields: [
      'placingAuthority',
      'socialWorkerName',
      'socialWorkerEmail',
      'socialWorkerPhone',
      'socialWorkerOffice',
      'personalAdviserName',
      'personalAdviserContact',
      'iroName',
      'iroContact',
      'keyWorker',
      'nextOfKin',
      'contactRestrictions',
      'otherContacts',
    ],
  },
  {
    id: 'plans',
    title: 'Care & risk plans',
    standard: 'Support standard',
    description:
      'Support / Pathway Plans, risk assessments, placement plan / care status and consents.',
    fields: [
      'legalStatus',
      'careStatus',
      'consents',
      'missingRisk',
      'abscondingProtocol',
    ],
  },
  {
    id: 'safeguarding',
    title: 'Safeguarding & incidents',
    standard: 'Protection standard',
    description:
      'Significant incidents, missing from care and return home interviews, safeguarding referrals, complaints and allegations.',
    fields: [],
  },
  {
    id: 'progress',
    title: 'Daily support & progress',
    standard: 'Support standard',
    description:
      'Quick logs, keywork, health, medication, EET and independence.',
    fields: [
      'preferredName',
      'gender',
      'ethnicity',
      'nhsNumber',
      'school',
      'schoolContact',
      'gpSurgery',
      'allergiesMedical',
      'ehcpStatus',
    ],
  },
]

export const QS_GROUP_IDS = QS_GROUPS.map((g) => g.id)

export const isQsGroupId = (v: unknown): v is QualityStandardGroupId =>
  typeof v === 'string' && (QS_GROUP_IDS as string[]).includes(v)

/** Shown last, for documents filed under a category with no group. */
export const OTHER_GROUP = {
  id: 'other',
  title: 'Other documents',
  standard: '',
  description:
    'Documents filed under a category with no Quality Standard group.',
} as const

export interface PackFact {
  label: string
  value: string
}

export interface PackGroup {
  id: QualityStandardGroupId | 'other'
  title: string
  standard: string
  description: string
  facts: PackFact[]
  documents: DocumentRecord[]
  /** Daily support & progress only: quick logs in the window, newest first. */
  logs: QuickLog[]
}

export interface PackInput {
  yp: YoungPerson
  home?: Home
  unit?: Unit
  /** All documents the viewer can see; this young person's are picked out. */
  documents: DocumentRecord[]
  /** All quick logs the viewer can see; this young person's are picked out. */
  logs: QuickLog[]
  categoryGroups: Record<string, QualityStandardGroupId>
  /** Applied to every free-text value, so names can be masked. */
  mask?: (text: string) => string
  /** Quick logs older than this (ms since epoch) are left out. */
  logsSince?: number
}

const PROFILE_LABEL = new Map(
  PROFILE_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f.label]),
)

/** One young person's records laid out under the Quality Standard groups, for inspection. */
export function buildYoungPersonPack({
  yp,
  home,
  unit,
  documents,
  logs,
  categoryGroups,
  mask = (t) => t,
  logsSince = -Infinity,
}: PackInput): PackGroup[] {
  const docs = documents
    .filter((d) => d.ownerType === 'young_person' && d.ownerId === yp.id)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .map((d) => ({ ...d, title: mask(d.title), fileName: mask(d.fileName) }))
  const groupOf = (d: DocumentRecord): PackGroup['id'] =>
    categoryGroups[d.category] ?? 'other'

  const groups: PackGroup[] = QS_GROUPS.map((g) => {
    const facts: PackFact[] =
      g.id === 'placement'
        ? [
            {
              label: 'Move-in date',
              value: yp.moveInDate ? formatDate(yp.moveInDate) : '',
            },
            { label: 'Home', value: home?.name ?? '' },
            { label: 'Unit', value: unit?.name ?? '' },
            { label: 'Date of birth', value: formatDate(yp.dateOfBirth) },
          ]
        : g.fields.map((key) => ({
            label: PROFILE_LABEL.get(key) ?? key,
            value: mask(yp[key]),
          }))
    return {
      id: g.id,
      title: g.title,
      standard: g.standard,
      description: g.description,
      facts,
      documents: docs.filter((d) => groupOf(d) === g.id),
      logs:
        g.id === 'progress'
          ? logs
              .filter(
                (l) =>
                  l.youngPersonId === yp.id &&
                  new Date(l.occurredAt).getTime() >= logsSince,
              )
              .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
              .map((l) => ({ ...l, note: mask(l.note) }))
          : [],
    }
  })

  const other = docs.filter((d) => groupOf(d) === 'other')
  if (other.length > 0)
    groups.push({ ...OTHER_GROUP, facts: [], documents: other, logs: [] })
  return groups
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Builds the Ofsted Mode masker for one young person's file: their own name becomes
 * their initials, every other young person's name is hidden, and staff names become
 * initials. Matching is whole-word and case-insensitive, longest name first.
 */
export function nameMasker({
  selfId,
  people,
  staff,
}: {
  selfId?: string
  people: Pick<YoungPerson, 'id' | 'fullName' | 'preferredName' | 'initials'>[]
  staff: Pick<StaffMember, 'fullName'>[]
}): (text: string) => string {
  const swaps: [string, string][] = []
  for (const p of people) {
    const to = p.id === selfId ? p.initials : '[another young person]'
    for (const name of [p.fullName, p.preferredName])
      if (name && name.trim().length > 1) swaps.push([name.trim(), to])
  }
  for (const s of staff)
    if (s.fullName.trim())
      swaps.push([s.fullName.trim(), initialsOf(s.fullName)])
  if (swaps.length === 0) return (t) => t

  swaps.sort((a, b) => b[0].length - a[0].length)
  const lookup = new Map(swaps.map(([from, to]) => [from.toLowerCase(), to]))
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${swaps.map(([from]) => escapeRegExp(from)).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  )
  return (text) =>
    text ? text.replace(pattern, (m) => lookup.get(m.toLowerCase()) ?? m) : text
}
