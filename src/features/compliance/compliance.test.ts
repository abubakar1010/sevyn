import type {
  Audit,
  Home,
  HomeFieldConfig,
  InterimMeasure,
  Policy,
  StaffMember,
} from '@/types'
import {
  actionPath,
  buildComplianceItems,
  countByStatus,
  homeStatus,
} from './compliance'

const now = new Date('2026-01-01')
const staff: StaffMember[] = [
  {
    id: 's1',
    homeId: 'h1',
    fullName: 'A',
    jobTitle: '',
    address: '',
    dbsRecheckDate: '2026-06-01',
    safeguardingExpiry: '2025-12-01',
    compliantToWork: true,
    complianceNote: '',
  },
  {
    id: 's2',
    homeId: 'h2',
    fullName: 'B',
    jobTitle: '',
    address: '',
    dbsRecheckDate: '2026-06-01',
    safeguardingExpiry: '2026-06-01',
    compliantToWork: true,
    complianceNote: '',
  },
]
const measure: InterimMeasure = {
  id: 'i',
  itemKey: 'safeguarding:s1',
  note: 'n',
  createdAt: '2026-01-01',
  active: true,
}

describe('compliance', () => {
  const items = buildComplianceItems(staff, [], [measure], now)
  it('flags expired items red and attaches the active interim measure', () => {
    const red = items.find((i) => i.key === 'safeguarding:s1')!
    expect(red.status).toBe('red')
    expect(red.interimMeasure?.id).toBe('i')
  })
  it('takes the worst status per home', () => {
    expect(homeStatus(items, 'h1')).toBe('red')
    expect(homeStatus(items, 'h2')).toBe('green')
  })
  it('counts by status', () => {
    expect(countByStatus(items)).toEqual({ red: 1, amber: 0, green: 3 })
  })
})

describe('policy and audit items', () => {
  const policies: Policy[] = [
    {
      id: 'p1',
      title: 'Safeguarding',
      lastReviewed: '2025-01-01',
      reviewDue: '2025-12-01',
      visibleToWorkers: true,
    },
  ]
  const audits: Audit[] = [
    {
      id: 'a1',
      homeId: 'h2',
      title: 'Fridge check',
      auditDate: '2025-12-30',
      requiredAction: '',
      resolved: true,
      expiryDate: '2026-01-10',
    },
    {
      id: 'a2',
      homeId: 'h2',
      title: 'One-off review',
      auditDate: '2025-12-30',
      requiredAction: '',
      resolved: true,
      expiryDate: null,
    },
  ]
  const items = buildComplianceItems(staff, [], [], now, 30, {
    policies,
    audits,
  })
  it('turns an expired policy red at organisation level', () => {
    const p = items.find((i) => i.key === 'policy:p1')!
    expect(p.status).toBe('red')
    expect(p.homeId).toBe('')
  })
  it('tracks audits that have a next-due date against their home', () => {
    expect(items.find((i) => i.key === 'audit:a1')?.status).toBe('amber')
    expect(items.some((i) => i.key === 'audit:a2')).toBe(false)
    expect(homeStatus(items, 'h2')).toBe('amber')
  })
})

describe('actionPath', () => {
  it('sends each item to the page where it is actioned', () => {
    expect(actionPath('dbs:s1', 'responsible_individual')).toBe(
      '/responsible-individual/staff',
    )
    expect(actionPath('safeguarding:s1', 'registered_manager')).toBe(
      '/manager/training',
    )
    expect(actionPath('training:t1', 'responsible_individual')).toBe(
      '/responsible-individual/training',
    )
    expect(actionPath('policy:p1', 'support_worker')).toBe('/worker/policies')
    expect(actionPath('audit:a1', 'responsible_individual')).toBe(
      '/responsible-individual/audits',
    )
  })
  it('returns null where the role has no such page', () => {
    expect(actionPath('audit:a1', 'registered_manager')).toBeNull()
    expect(actionPath('dbs:s1', 'support_worker')).toBeNull()
    expect(actionPath('unknown:x', 'responsible_individual')).toBeNull()
  })
})

describe('tracked home date fields', () => {
  const homeFields: HomeFieldConfig = {
    sections: [{ id: 's', name: 'Premises' }],
    fields: [
      {
        id: 'ins',
        label: 'Insurance renewal',
        type: 'date',
        sectionId: 's',
        required: false,
        trackExpiry: true,
      },
      {
        id: 'untracked',
        label: 'Opened on',
        type: 'date',
        sectionId: 's',
        required: false,
      },
      {
        id: 'old',
        label: 'Old date',
        type: 'date',
        sectionId: 's',
        required: false,
        trackExpiry: true,
        archived: true,
      },
      {
        id: 'text',
        label: 'Note',
        type: 'text',
        sectionId: 's',
        required: false,
      },
    ],
  }
  const home = (id: string, customFields: Record<string, string>) =>
    ({ id, name: `Home ${id}`, customFields }) as Home
  const build = (homes: Home[]) =>
    buildComplianceItems([], [], [], now, 30, { homes, homeFields })

  it('turns tracked dates into items with the usual red, amber and green', () => {
    const items = build([
      home('h1', { ins: '2025-12-01' }),
      home('h2', { ins: '2026-01-15' }),
      home('h3', { ins: '2026-09-01' }),
    ])
    expect(items.map((i) => [i.key, i.status])).toEqual([
      ['homefield:h1:ins', 'red'],
      ['homefield:h2:ins', 'amber'],
      ['homefield:h3:ins', 'green'],
    ])
    expect(items[0]).toMatchObject({
      homeId: 'h1',
      subject: 'Home h1',
      label: 'Insurance renewal',
      due: '2025-12-01',
    })
    expect(homeStatus(items, 'h1')).toBe('red')
  })

  it('ignores untracked, retired and non-date fields, and empty dates', () => {
    expect(
      build([
        home('h1', { untracked: '2020-01-01', old: '2020-01-01', text: 'x' }),
        home('h2', {}),
      ]),
    ).toEqual([])
  })

  it('adds nothing without a field setup', () => {
    expect(
      buildComplianceItems([], [], [], now, 30, {
        homes: [home('h1', { ins: '2020-01-01' })],
      }),
    ).toEqual([])
  })
})

describe('actionPath for home fields', () => {
  it('sends the item to the homes page for roles that have one', () => {
    expect(actionPath('homefield:h1:ins', 'responsible_individual')).toBe(
      '/responsible-individual/homes',
    )
    expect(actionPath('homefield:h1:ins', 'registered_manager')).toBe(
      '/manager/homes',
    )
    expect(actionPath('homefield:h1:ins', 'support_worker')).toBeNull()
  })
})
