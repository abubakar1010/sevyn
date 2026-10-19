import type { YoungPerson } from '@/types'
import { canViewRestricted, youngPersonName } from './display'

const yp: YoungPerson = {
  id: '1',
  homeId: 'h',
  initials: 'A.B.',
  fullName: 'Demo Person',
  dateOfBirth: '2010-01-01',
  restricted: false,
}

it('shows initials only in Ofsted Mode', () => {
  expect(youngPersonName(yp, true)).toBe('A.B.')
  expect(youngPersonName(yp, false)).toBe('Demo Person')
})
it('blocks restricted records for support workers only', () => {
  expect(canViewRestricted('support_worker')).toBe(false)
  expect(canViewRestricted('registered_manager')).toBe(true)
})
