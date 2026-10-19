import { createContext, useContext } from 'react'

interface OfstedModeState {
  enabled: boolean
  toggle: () => void
}

export const OfstedModeContext = createContext<OfstedModeState>({
  enabled: false,
  toggle: () => {},
})

export const useOfstedMode = () => useContext(OfstedModeContext)
