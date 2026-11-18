import type { QuickLog } from '@/types'
import { buildProgressSeries, summariseRatings, valueAt } from './progress'

const log = (
  id: string,
  occurredAt: string,
  tags: string[],
  ratings?: QuickLog['ratings'],
): QuickLog => ({
  id,
  homeId: 'h1',
  youngPersonId: 'y1',
  authorId: 's1',
  createdAt: occurredAt,
  occurredAt,
  tags,
  note: 'n',
  ratings,
})

describe('buildProgressSeries', () => {
  const logs = [
    log('c', '2026-03-03', ['Health'], { Health: -1 }),
    log('a', '2026-03-01', ['Health', 'Education'], {
      Health: 1,
      Education: 1,
    }),
    log('b', '2026-03-02', ['Health'], { Health: 1 }),
    log('d', '2026-03-04', ['Behaviour']),
  ]

  it('keeps a running total per area, in date order', () => {
    const health = buildProgressSeries(logs).find((s) => s.area === 'Health')!
    expect(health.points.map((p) => p.total)).toEqual([1, 2, 1])
    expect(health.points[0].time).toBeLessThan(health.points[2].time)
  })

  it('only includes areas that have a rating', () => {
    const areas = buildProgressSeries(logs).map((s) => s.area)
    expect(areas.sort()).toEqual(['Education', 'Health'])
  })

  it('ignores ratings for tags the log does not carry', () => {
    const series = buildProgressSeries([
      log('x', '2026-03-01', ['Health'], { Health: 1, Education: 1 }),
    ])
    expect(series.map((s) => s.area)).toEqual(['Health'])
  })

  it('returns nothing when no log is rated', () => {
    expect(buildProgressSeries([log('z', '2026-03-01', ['Health'])])).toEqual(
      [],
    )
  })
})

describe('valueAt', () => {
  const [health] = buildProgressSeries([
    log('a', '2026-03-01', ['Health'], { Health: 1 }),
    log('b', '2026-03-05', ['Health'], { Health: -1 }),
  ])
  it('carries the last total forward and is null before the first log', () => {
    expect(valueAt(health, new Date('2026-02-01').getTime())).toBeNull()
    expect(valueAt(health, new Date('2026-03-03').getTime())).toBe(1)
    expect(valueAt(health, new Date('2026-03-06').getTime())).toBe(0)
  })
})

describe('summariseRatings', () => {
  const logs = [
    log('a', '2026-03-01', ['Health', 'Education'], {
      Health: 1,
      Education: 1,
    }),
    log('b', '2026-03-02', ['Health'], { Health: 0 }),
    log('c', '2026-03-03', ['Health'], { Health: -1 }),
    log('d', '2026-03-04', ['Education'], { Education: 1, Health: 1 }), // Health untagged: ignored
    log('e', '2026-03-05', ['Behaviour']), // unrated
  ]

  it('counts progressing, no change and declined overall and per area', () => {
    const s = summariseRatings(logs, -Infinity, ['Education', 'Health'])
    expect(s.overall).toEqual({
      progressing: 3,
      noChange: 1,
      declined: 1,
      total: 5,
    })
    expect(s.byArea).toEqual([
      { area: 'Education', progressing: 2, noChange: 0, declined: 0, total: 2 },
      { area: 'Health', progressing: 1, noChange: 1, declined: 1, total: 3 },
    ])
  })

  it('only counts logs on or after the start of the period', () => {
    const s = summariseRatings(logs, new Date('2026-03-03').getTime())
    expect(s.overall).toEqual({
      progressing: 1,
      noChange: 0,
      declined: 1,
      total: 2,
    })
  })

  it('is empty when nothing is rated', () => {
    const s = summariseRatings([log('x', '2026-03-01', ['Health'])])
    expect(s.overall.total).toBe(0)
    expect(s.byArea).toEqual([])
  })
})
