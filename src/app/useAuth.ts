import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

export interface AuthState {
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  /** Demo-only: sign in as a fictional user until Supabase Auth is wired up. */
  signInAs: (profile: Profile) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
