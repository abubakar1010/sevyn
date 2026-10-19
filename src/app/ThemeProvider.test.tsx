import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ThemeProvider } from './ThemeProvider'
import { THEME_KEY } from './useTheme'

function mockSystemDark(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ThemeProvider', () => {
  it('follows the system theme when nothing is saved', () => {
    mockSystemDark(true)
    renderToggle()
    expect(document.documentElement).toHaveClass('dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument()
  })

  it('toggles, applies the dark class and remembers the choice', async () => {
    mockSystemDark(false)
    renderToggle()
    expect(document.documentElement).not.toHaveClass('dark')
    await userEvent.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    )
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    await userEvent.click(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    )
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('prefers a saved choice over the system theme', () => {
    mockSystemDark(true)
    localStorage.setItem(THEME_KEY, 'light')
    renderToggle()
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
