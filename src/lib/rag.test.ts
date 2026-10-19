import { ragForDate, worstRag } from './rag'

const now = new Date('2026-01-01')

describe('ragForDate', () => {
  it('is red when missing or expired', () => {
    expect(ragForDate(null, now)).toBe('red')
    expect(ragForDate(new Date('2025-12-31'), now)).toBe('red')
  })
  it('is amber within the window', () => {
    expect(ragForDate(new Date('2026-01-15'), now)).toBe('amber')
  })
  it('is green beyond the window', () => {
    expect(ragForDate(new Date('2026-06-01'), now)).toBe('green')
  })
})

describe('worstRag', () => {
  it('returns the most severe status', () => {
    expect(worstRag(['green', 'red', 'amber'])).toBe('red')
    expect(worstRag([])).toBe('green')
  })
})
