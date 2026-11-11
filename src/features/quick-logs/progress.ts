import type { QuickLog } from '@/types'

export type Rating = -1 | 0 | 1

export const RATING_LABEL: Record<Rating, string> = {
  [-1]: 'Declined',
  0: 'No change',
  1: 'Progressing',
}

export interface ProgressPoint {
  /** `occurredAt` timestamp in ms. */
  time: number
  /** Running total of ratings for this area up to and including this log. */
  total: number
}

export interface ProgressSeries {
  area: string
  points: ProgressPoint[]
}

/**
 * Turns a young person's rated logs into one running-total line per progress area.
 * Up means more logs showing progress than decline; down means the opposite.
 * Logs without a rating for an area are ignored for that area.
 */
export function buildProgressSeries(logs: QuickLog[]): ProgressSeries[] {
  const ordered = [...logs].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  )
  const byArea = new Map<string, ProgressPoint[]>()
  for (const log of ordered) {
    for (const [area, rating] of Object.entries(log.ratings ?? {})) {
      if (!log.tags.includes(area)) continue
      const points = byArea.get(area) ?? []
      const previous = points.at(-1)?.total ?? 0
      points.push({
        time: new Date(log.occurredAt).getTime(),
        total: previous + rating,
      })
      byArea.set(area, points)
    }
  }
  return [...byArea].map(([area, points]) => ({ area, points }))
}

/** Value of a series at `time`: its last point at or before it, or null before it starts. */
export function valueAt(series: ProgressSeries, time: number): number | null {
  let value: number | null = null
  for (const p of series.points) {
    if (p.time > time) break
    value = p.total
  }
  return value
}
