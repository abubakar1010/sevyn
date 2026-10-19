import { useAuth } from '@/app/useAuth'

/** Admins and Registered Managers can edit; Support Workers are read-only. */
export function useCanEdit() {
  const { profile } = useAuth()
  return profile !== null && profile.role !== 'support_worker'
}
