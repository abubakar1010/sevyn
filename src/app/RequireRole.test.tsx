import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Profile } from '@/types'
import { RequireRole } from './RequireRole'

let current: Profile | null = null
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    profile: current,
    loading: false,
    signOut: async () => {},
  }),
}))

function renderAt(profile: Profile | null) {
  current = profile
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="/admin" element={<p>admin area</p>} />
        </Route>
        <Route path="/login" element={<p>login</p>} />
        <Route path="/worker" element={<p>worker home</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  it('redirects anonymous users to login', () => {
    renderAt(null)
    expect(screen.getByText('login')).toBeInTheDocument()
  })
  it('redirects other roles to their home', () => {
    renderAt({
      id: '1',
      organisationId: 'o',
      role: 'support_worker',
      fullName: 'A',
      homeIds: [],
    })
    expect(screen.getByText('worker home')).toBeInTheDocument()
  })
  it('allows permitted roles', () => {
    renderAt({
      id: '1',
      organisationId: 'o',
      role: 'admin',
      fullName: 'A',
      homeIds: [],
    })
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })
})
