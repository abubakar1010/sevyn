import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { addInterimMeasure } from '@/data/api'
import { demoUsers } from '@/data/demoUsers'
import type { Profile } from '@/types'
import { AuthContext } from './useAuth'
import { routes } from './router'

const [admin, manager, worker] = demoUsers

// Every role's routes must render their page heading with demo data and no runtime errors.
const CASES: [Profile, string, string][] = [
  [admin, '/admin', 'Compliance dashboard'],
  [admin, '/admin/users', 'Users & roles'],
  [admin, '/admin/homes', 'Homes & units'],
  [admin, '/admin/staff', 'Staff'],
  [admin, '/admin/tasks', 'Tasks'],
  [admin, '/admin/training', 'Training matrix'],
  [admin, '/admin/interim-measures', 'Interim measures'],
  [admin, '/admin/audits', 'Audits'],
  [admin, '/admin/policies', 'Policies'],
  [admin, '/admin/audit-log', 'Audit log'],
  [admin, '/admin/settings', 'Settings'],
  [manager, '/manager', 'Compliance dashboard'],
  [manager, '/manager/homes', 'Homes & units'],
  [manager, '/manager/young-people', 'Young people'],
  [manager, '/manager/quick-logs', 'Quick logs'],
  [manager, '/manager/tasks', 'Tasks'],
  [manager, '/manager/training', 'Training matrix'],
  [manager, '/manager/staff', 'Staff'],
  [manager, '/manager/interim-measures', 'Interim measures'],
  [manager, '/manager/policies', 'Policies'],
  [manager, '/manager/audit-log', 'Audit log'],
  [worker, '/worker', 'Compliance dashboard'],
  [worker, '/worker/young-people', 'Young people'],
  [worker, '/worker/quick-logs', 'Quick logs'],
  [worker, '/worker/tasks', 'Tasks'],
  [worker, '/worker/policies', 'Policies'],
  [worker, '/worker/interim-measures', 'Interim measures'],
]

describe.each(CASES)('%o', (profile, path, heading) => {
  it(`${profile.role} renders ${path}`, async () => {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <AuthContext
          value={{
            profile,
            loading: false,
            signOut: async () => {},
            signInAs: () => {},
          }}
        >
          <RouterProvider router={router} />
        </AuthContext>
      </QueryClientProvider>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Could not load data')).not.toBeInTheDocument()
  })
})

it('support workers cannot open admin routes', async () => {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/admin/users'],
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext
        value={{
          profile: worker,
          loading: false,
          signOut: async () => {},
          signInAs: () => {},
        }}
      >
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Compliance dashboard',
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/worker')
})

function renderAt(profile: Profile, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext
        value={{
          profile,
          loading: false,
          signOut: async () => {},
          signInAs: () => {},
        }}
      >
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
}

it('shows audits to the admin', async () => {
  renderAt(admin, '/admin/audits')
  expect(await screen.findByText('Medication audit')).toBeInTheDocument()
})

it('lets managers manage policies and hides audits from them', async () => {
  renderAt(manager, '/manager/policies')
  expect(
    await screen.findByText('Behaviour support policy'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Mark Safeguarding policy reviewed' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Audits' })).not.toBeInTheDocument()
})

it('only shows support workers the policies shared with them', async () => {
  renderAt(worker, '/worker/policies')
  expect(await screen.findByText('Complaints procedure')).toBeInTheDocument()
  expect(screen.queryByText('Behaviour support policy')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /reviewed/ }),
  ).not.toBeInTheDocument()
})

it('moves a measure to history once its item is no longer red', async () => {
  await addInterimMeasure(manager, {
    itemKey: 'dbs:s1',
    note: 'Historic measure note',
  })
  renderAt(manager, '/manager/interim-measures')
  expect(
    await screen.findByRole('heading', { name: 'Closed measures' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Historic measure note')).toBeInTheDocument()
})
