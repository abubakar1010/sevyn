import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useIdleTimeout } from '@/lib/useIdleTimeout'
import type { Profile } from '@/types'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: load session + profile (role, organisation) once the backend exists.
    supabase.auth.getSession().finally(() => setLoading(false))
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  useIdleTimeout(signOut, undefined, profile !== null)

  return (
    <AuthContext value={{ profile, loading, signOut, signInAs: setProfile }}>
      {children}
    </AuthContext>
  )
}
