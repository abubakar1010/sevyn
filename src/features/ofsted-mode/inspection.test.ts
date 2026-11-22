import { buildComplianceItems } from '@/features/compliance/compliance'
import type {
  Audit,
  DocumentRecord,
  Home,
  Policy,
  QuickLog,
  StaffMember,
  YoungPerson,
} from '@/types'
import { buildInspectionSummary } from './inspection'

const now = new Date('2026-06-15T12:00:00Z')

const home = { id: 'h1', approvedCapacity: 4 } as Home

const staff = (id: string, over: Partial<StaffMember> = {}): StaffMember =>
  ({
    id,
    homeId: 'h1',
    fullName: `Staff ${id}`,
    dbsRecheckDate: '2027-01-01',
    safeguardingExpiry: '2027-01-01',
    compliantToWork: true,
    ...over,
  }) as StaffMember

const people = [
  { id: 'y1', homeId: 'h1', restricted: false, moveInDate: '2025-06-01' },
  { id: 'y2', homeId: 'h1', restricted: true, moveInDate: '2024-02-01' },
  { id: 'y3', homeId: 'h2', restricted: false },
] as YoungPerson[]

const audits = [
  {
    id: 'a1',
    homeId: 'h1',
    title: 'Medication audit',
    requiredAction: 'Fix MAR chart',
    resolved: false,
    expiryDate: '2026-06-01',
  },
  {
    id: 'a2',
    homeId: 'h1',
    title: 'Fire audit',
    requiredAction: 'Done',
    resolved: true,
    expiryDate: '2026-12-01',
  },
  {
    id: 'a3',
    homeId: 'h2',
    title: 'Other home',
    requiredAction: 'Something',
    resolved: false,
    expiryDate: '2026-01-01',
  },
] as Audit[]

const policies = [
  { id: 'p1', title: 'Expired', reviewDue: '2026-05-01' },
  { id: 'p2', title: 'Soon', reviewDue: '2026-06-30' },
  { id: 'p3', title: 'Fine', reviewDue: '2027-06-30' },
] as Policy[]

const doc = (
  id: string,
  category: string,
  ownerId = 'h1',
  ownerType = 'home',
) => ({ id, category, ownerId, ownerType }) as DocumentRecord

const log = (
  id: string,
  occurredAt: string,
  rating: -1 | 0 | 1,
  homeId = 'h1',
) =>
  ({
    id,
    homeId,
    occurredAt,
    tags: ['Health'],
    ratings: { Health: rating },
  }) as unknown as QuickLog

function summary() {
  const allStaff = [
    staff('s1'),
    staff('s2', { compliantToWork: false, dbsRecheckDate: '2026-06-01' }),
    staff('s3', { homeId: 'h2', compliantToWork: false }),
  ]
  return buildInspectionSummary({
    home,
    items: buildComplianceItems(allStaff, [], [], now, 30, {
      policies,
      audits,
    }),
    staff: allStaff,
    youngPeople: people,
    audits,
    policies,
    documents: [
      doc('d1', 'Fire risk assessment'),
      doc('d2', 'Fire risk assessment'),
      doc('d3', 'Insurance'),
      doc('d4', 'Insurance', 'h2'),
      doc('d5', 'Letters', 'y1', 'young_person'),
    ],
    logs: [
      log('l1', '2026-06-10', 1),
      log('l2', '2026-06-11', -1),
      log('l3', '2026-01-01', 1), // outside the 90-day window
      log('l4', '2026-06-12', 1, 'h2'), // another home
    ],
    amberDays: 30,
    now,
  })
}

describe('buildInspectionSummary', () => {
  it('reports status and outstanding items for this home only', () => {
    const s = summary()
    expect(s.rag).toBe('red')
    expect(s.outstanding.map((i) => i.key)).toEqual(
      expect.arrayContaining(['dbs:s2', 'audit:a1']),
    )
    expect(s.outstanding.every((i) => i.homeId === 'h1')).toBe(true)
    expect(s.outstanding[0].status).toBe('red')
  })

  it('counts staff ready to work and lists those who are not', () => {
    const s = summary()
    expect(s.staff.total).toBe(2)
    expect(s.staff.ready).toBe(1)
    expect(s.staff.notReady.map((x) => x.id)).toEqual(['s2'])
  })

  it('counts young people against approved capacity', () => {
    expect(summary().youngPeople).toMatchObject({
      count: 2,
      capacity: 4,
      restricted: 1,
    })
  })

  it("lists only this home's young people, earliest move-in first", () => {
    const list = summary().youngPeople.list
    expect(list.every((y) => y.homeId === 'h1')).toBe(true)
    expect(list.map((y) => y.id)).toEqual(['y2', 'y1'])
  })

  it('lists open audit actions and overdue audits for the home', () => {
    const s = summary()
    expect(s.audits.openActions.map((a) => a.id)).toEqual(['a1'])
    expect(s.audits.overdue).toBe(1)
  })

  it('counts organisation policies that are overdue or due soon', () => {
    expect(summary().policies).toEqual({ total: 3, overdue: 1, dueSoon: 1 })
  })

  it('groups only the home’s own documents by category', () => {
    expect(summary().documents).toEqual([
      { category: 'Fire risk assessment', count: 2 },
      { category: 'Insurance', count: 1 },
    ])
  })

  it('summarises ratings for this home within the last 90 days', () => {
    expect(summary().ratings.overall).toEqual({
      progressing: 1,
      noChange: 0,
      declined: 1,
      total: 2,
    })
  })

  it('is green with nothing outstanding for a clean home', () => {
    const s = buildInspectionSummary({
      home: { id: 'h9', approvedCapacity: 1 } as Home,
      items: [],
      staff: [],
      youngPeople: [],
      audits: [],
      policies: [],
      documents: [],
      logs: [],
      amberDays: 30,
      now,
    })
    expect(s.rag).toBe('green')
    expect(s.outstanding).toEqual([])
    expect(s.staff).toEqual({ total: 0, ready: 0, notReady: [] })
  })
})
