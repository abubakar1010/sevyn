import { LOG_TAGS } from '@/features/quick-logs/tags'
import {
  summariseRatings,
  type RatingSummary,
} from '@/features/quick-logs/progress'
import { ragForDate, worstRag } from '@/lib/rag'
import type {
  Audit,
  ComplianceItem,
  DocumentRecord,
  Home,
  Policy,
  QuickLog,
  Rag,
  StaffMember,
  YoungPerson,
} from '@/types'

const DAY_MS = 86_400_000
/** Quick log ratings in the inspection pack cover this many days. */
export const RATINGS_WINDOW_DAYS = 90

export interface InspectionSummary {
  /** Worst status across everything attached to this home. */
  rag: Rag
  /** Red and amber items for this home, red first. */
  outstanding: ComplianceItem[]
  staff: { total: number; ready: number; notReady: StaffMember[] }
  youngPeople: { count: number; capacity: number; restricted: number }
  audits: { openActions: Audit[]; overdue: number }
  /** Organisation-wide policies, which apply to every home. */
  policies: { total: number; overdue: number; dueSoon: number }
  /** Documents held on the home itself, by category (largest set first, then A–Z). */
  documents: { category: string; count: number }[]
  ratings: RatingSummary
}

export interface InspectionInput {
  home: Home
  /** Compliance items for the whole organisation; this home's are picked out. */
  items: ComplianceItem[]
  staff: StaffMember[]
  youngPeople: YoungPerson[]
  audits: Audit[]
  policies: Policy[]
  documents: DocumentRecord[]
  logs: QuickLog[]
  amberDays: number
  now?: Date
}

/** Everything an inspector asks about one home, drawn from data the platform already holds. */
export function buildInspectionSummary({
  home,
  items,
  staff,
  youngPeople,
  audits,
  policies,
  documents,
  logs,
  amberDays,
  now = new Date(),
}: InspectionInput): InspectionSummary {
  const homeItems = items.filter((i) => i.homeId === home.id)
  const order: Rag[] = ['red', 'amber', 'green']
  const homeStaff = staff.filter((s) => s.homeId === home.id)
  const homeYoungPeople = youngPeople.filter((y) => y.homeId === home.id)
  const homeAudits = audits.filter((a) => a.homeId === home.id)
  const today = now.toISOString().slice(0, 10)

  const byCategory = new Map<string, number>()
  for (const d of documents)
    if (d.ownerType === 'home' && d.ownerId === home.id)
      byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + 1)

  const policyStatus = policies.map((p) =>
    ragForDate(new Date(p.reviewDue), now, amberDays),
  )

  return {
    rag: worstRag(homeItems.map((i) => i.status)),
    outstanding: homeItems
      .filter((i) => i.status !== 'green')
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status)),
    staff: {
      total: homeStaff.length,
      ready: homeStaff.filter((s) => s.compliantToWork).length,
      notReady: homeStaff.filter((s) => !s.compliantToWork),
    },
    youngPeople: {
      count: homeYoungPeople.length,
      capacity: home.approvedCapacity,
      restricted: homeYoungPeople.filter((y) => y.restricted).length,
    },
    audits: {
      openActions: homeAudits.filter((a) => !a.resolved && a.requiredAction),
      overdue: homeAudits.filter((a) => a.expiryDate && a.expiryDate < today)
        .length,
    },
    policies: {
      total: policies.length,
      overdue: policyStatus.filter((s) => s === 'red').length,
      dueSoon: policyStatus.filter((s) => s === 'amber').length,
    },
    documents: [...byCategory]
      .map(([category, count]) => ({ category, count }))
      .sort(
        (a, b) => b.count - a.count || a.category.localeCompare(b.category),
      ),
    ratings: summariseRatings(
      logs.filter((l) => l.homeId === home.id),
      now.getTime() - RATINGS_WINDOW_DAYS * DAY_MS,
      LOG_TAGS,
    ),
  }
}
