import { profile } from '@/data/mock'
import type { DocumentRecord, QuickLog, YoungPerson } from '@/types'
import { buildYoungPersonPack, nameMasker, QS_GROUPS } from './qualityStandards'

const yp = (id: string, fullName: string, initials: string, over = {}) =>
  ({
    id,
    homeId: 'h1',
    initials,
    fullName,
    dateOfBirth: '2008-05-01',
    moveInDate: '2025-01-10',
    unitId: 'u1',
    restricted: false,
    ...profile({ socialWorkerName: 'Pat Social', ...over }),
  }) as YoungPerson

const me = yp('y1', 'Jamie Rivers', 'J.R.', {
  preferredName: 'Jay',
  keyWorker: 'Sam Taylor',
})
const other = yp('y2', 'Casey Stone', 'C.S.')

const doc = (id: string, category: string, ownerId = 'y1'): DocumentRecord => ({
  id,
  homeId: 'h1',
  ownerType: 'young_person',
  ownerId,
  title: `${category} doc`,
  category,
  fileName: `${id}.pdf`,
  uploadedAt: '2026-01-01',
})

const log = (
  id: string,
  ypId: string,
  occurredAt: string,
  note = '',
): QuickLog => ({
  id,
  homeId: 'h1',
  youngPersonId: ypId,
  authorId: 's2',
  createdAt: occurredAt,
  occurredAt,
  tags: ['Keywork'],
  note,
})

describe('buildYoungPersonPack', () => {
  const pack = buildYoungPersonPack({
    yp: me,
    home: { id: 'h1', name: 'Oak House' } as never,
    unit: { id: 'u1', homeId: 'h1', name: 'Annexe', capacity: 2 },
    documents: [
      doc('d1', 'Pathway Plan'),
      doc('d2', 'Missing from care & return home interviews'),
      doc('d3', 'Unmapped thing'),
      doc('d4', 'Pathway Plan', 'y2'),
      { ...doc('d5', 'Pathway Plan'), ownerType: 'staff' },
    ],
    logs: [
      log('l1', 'y1', '2026-02-01'),
      log('l2', 'y1', '2026-03-01'),
      log('l3', 'y2', '2026-03-01'),
      log('l4', 'y1', '2025-01-01'),
    ],
    categoryGroups: {
      'Pathway Plan': 'plans',
      'Missing from care & return home interviews': 'safeguarding',
    },
    logsSince: new Date('2026-01-01').getTime(),
  })
  const group = (id: string) => pack.find((g) => g.id === id)!

  it('lays out every Quality Standard group in order, then other documents', () => {
    expect(pack.map((g) => g.id)).toEqual([
      ...QS_GROUPS.map((g) => g.id),
      'other',
    ])
  })
  it('shows placement details: move-in date, home and unit', () => {
    const facts = Object.fromEntries(
      group('placement').facts.map((f) => [f.label, f.value]),
    )
    expect(facts.Home).toBe('Oak House')
    expect(facts.Unit).toBe('Annexe')
    expect(facts['Move-in date']).toMatch(/2025/)
  })
  it('shows statutory contacts', () => {
    expect(group('contacts').facts).toContainEqual({
      label: 'Social worker name',
      value: 'Pat Social',
    })
    expect(group('contacts').facts.map((f) => f.label)).toEqual(
      expect.arrayContaining([
        'Personal Adviser (PA) name',
        'IRO name',
        'Other appropriate contacts',
      ]),
    )
  })
  it("files only this young person's documents under their group", () => {
    expect(group('plans').documents.map((d) => d.id)).toEqual(['d1'])
    expect(group('safeguarding').documents.map((d) => d.id)).toEqual(['d2'])
    expect(group('other').documents.map((d) => d.id)).toEqual(['d3'])
  })
  it('puts quick logs in the window under daily support, newest first', () => {
    expect(group('progress').logs.map((l) => l.id)).toEqual(['l2', 'l1'])
    expect(group('plans').logs).toEqual([])
  })
  it('leaves out the other documents group when nothing is unmapped', () => {
    const p = buildYoungPersonPack({
      yp: me,
      documents: [],
      logs: [],
      categoryGroups: {},
    })
    expect(p.some((g) => g.id === 'other')).toBe(false)
  })
})

describe('nameMasker', () => {
  const mask = nameMasker({
    selfId: 'y1',
    people: [me, other],
    staff: [{ fullName: 'Sam Taylor' }, { fullName: 'Alex Morgan' }],
  })

  it("initials the young person's own name and preferred name", () => {
    expect(mask('Jamie Rivers went to college. Jay was happy.')).toBe(
      'J.R. went to college. J.R. was happy.',
    )
  })
  it("hides other young people's names", () => {
    expect(mask('Argued with casey stone at dinner')).toBe(
      'Argued with [another young person] at dinner',
    )
  })
  it('initials staff names', () => {
    expect(mask('Keywork with Sam Taylor; Alex Morgan informed')).toBe(
      'Keywork with ST; AM informed',
    )
  })
  it('only replaces whole names', () => {
    expect(mask('Jayden and Samantha Taylors')).toBe(
      'Jayden and Samantha Taylors',
    )
  })
  it('applies to the pack', () => {
    const pack = buildYoungPersonPack({
      yp: me,
      documents: [],
      logs: [log('l1', 'y1', '2026-01-01', 'Casey Stone visited Jay')],
      categoryGroups: {},
      mask,
    })
    const progress = pack.find((g) => g.id === 'progress')!
    expect(progress.logs[0].note).toBe('[another young person] visited J.R.')
    expect(pack.find((g) => g.id === 'contacts')!.facts).toContainEqual({
      label: 'Assigned key worker',
      value: 'ST',
    })
  })
})
