import { useState, type ReactNode } from 'react'
import { OfstedModeContext } from './useOfstedMode'

/** When enabled, views should mask staff addresses and other young people's names. */
export function OfstedModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  return (
    <OfstedModeContext value={{ enabled, toggle: () => setEnabled((v) => !v) }}>
      {children}
    </OfstedModeContext>
  )
}
