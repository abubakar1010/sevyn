import type { Profile } from '@/types'

/** Fictional demo-tenant users for previewing each role without a backend. */
export const demoUsers: Profile[] = [
  {
    id: 'u-admin',
    organisationId: 'demo-org',
    role: 'admin',
    fullName: 'Demo Admin',
    homeIds: [],
  },
  {
    id: 's1',
    organisationId: 'demo-org',
    role: 'registered_manager',
    fullName: 'Alex Morgan',
    homeIds: ['h1', 'h2'],
  },
  {
    id: 's2',
    organisationId: 'demo-org',
    role: 'support_worker',
    fullName: 'Sam Taylor',
    homeIds: ['h1'],
  },
]
