import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeState {
  theme: Theme
  toggle: () => void
}

export const THEME_KEY = 'sevyn-theme'

export const ThemeContext = createContext<ThemeState>({
  theme: 'light',
  toggle: () => {},
})

export const useTheme = () => useContext(ThemeContext)
