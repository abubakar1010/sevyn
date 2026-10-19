import type { InterimMeasure, StaffMember } from '@/types'
import { buildComplianceItems, countByStatus, homeStatus } from './compliance'

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
  },
  {
    id: 's2',
    homeId: 'h2',
    fullName: 'B',
    jobTitle: '',
    address: '',
    dbsRecheckDate: '2026-06-01',
    safeguardingExpiry: '2026-06-01',
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
