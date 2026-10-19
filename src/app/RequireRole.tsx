import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/types'
import { HOME_BY_ROLE } from './homeByRole'
import { useAuth } from './useAuth'

export function RequireRole({ roles }: { roles: Role[] }) {
  const { profile, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  if (!profile) return <Navigate to="/login" replace />
  if (!roles.includes(profile.role))
    return <Navigate to={HOME_BY_ROLE[profile.role]} replace />
  return <Outlet />
}
