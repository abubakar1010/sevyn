import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { demoUsers } from '@/data/demoUsers'
import type { Profile } from '@/types'
import { AuthContext } from './useAuth'
import { routes } from './router'

const [admin, manager, worker] = demoUsers

// Every role's routes must render their page heading with demo data and no runtime errors.
const CASES: [Profile, string, string][] = [
  [admin, '/admin', 'Compliance dashboard'],
  [admin, '/admin/organisations', 'Organisations'],
  [admin, '/admin/users', 'Users & roles'],
  [admin, '/admin/homes', 'Homes & units'],
  [admin, '/admin/staff', 'Staff'],
  [admin, '/admin/training', 'Training matrix'],
  [admin, '/admin/interim-measures', 'Interim measures'],
  [admin, '/admin/documents', 'Documents & policies'],
  [admin, '/admin/audit-log', 'Audit log'],
  [admin, '/admin/settings', 'Settings'],
  [manager, '/manager', 'Compliance dashboard'],
  [manager, '/manager/homes', 'Homes & units'],
  [manager, '/manager/young-people', 'Young people'],
  [manager, '/manager/quick-logs', 'Quick logs'],
  [manager, '/manager/tasks', 'Tasks'],
  [manager, '/manager/audits-policies', 'Audits & Policies'],
  [manager, '/manager/training', 'Training matrix'],
  [manager, '/manager/staff', 'Staff'],
  [manager, '/manager/interim-measures', 'Interim measures'],
  [manager, '/manager/documents', 'Documents & policies'],
  [manager, '/manager/audit-log', 'Audit log'],
  [worker, '/worker', 'Compliance dashboard'],
  [worker, '/worker/young-people', 'Young people'],
  [worker, '/worker/quick-logs', 'Quick logs'],
  [worker, '/worker/tasks', 'Tasks'],
  [worker, '/worker/documents', 'Documents & policies'],
  [worker, '/worker/interim-measures', 'Interim measures'],
  [worker, '/worker/training', 'Training matrix'],
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

it('shows audits and policy reviews with demo data', async () => {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/manager/audits-policies'],
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext
        value={{
          profile: manager,
          loading: false,
          signOut: async () => {},
          signInAs: () => {},
        }}
      >
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
  expect(await screen.findByText('Medication audit')).toBeInTheDocument()
  expect(
    await screen.findByText('Behaviour support policy'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Mark Safeguarding policy reviewed' }),
  ).toBeInTheDocument()
})
