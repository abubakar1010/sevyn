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

export interface RatingTally {
  declined: number
  noChange: number
  progressing: number
  total: number
}

export interface AreaTally extends RatingTally {
  area: string
}

export interface RatingSummary {
  overall: RatingTally
  /** One entry per progress area that has at least one rating, in a stable order. */
  byArea: AreaTally[]
}

const emptyTally = (): RatingTally => ({
  declined: 0,
  noChange: 0,
  progressing: 0,
  total: 0,
})

function addRating(t: RatingTally, rating: Rating) {
  if (rating < 0) t.declined++
  else if (rating > 0) t.progressing++
  else t.noChange++
  t.total++
}

/**
 * Counts how many ratings were Declined, No change or Progressing, overall and per
 * progress area, for logs that happened at or after `sinceMs`. Like the progress graph,
 * a rating only counts when its area is also tagged on the log.
 */
export function summariseRatings(
  logs: QuickLog[],
  sinceMs = -Infinity,
  areaOrder: readonly string[] = [],
): RatingSummary {
  const overall = emptyTally()
  const byArea = new Map<string, RatingTally>()
  for (const log of logs) {
    if (new Date(log.occurredAt).getTime() < sinceMs) continue
    for (const [area, rating] of Object.entries(log.ratings ?? {})) {
      if (!log.tags.includes(area)) continue
      const tally = byArea.get(area) ?? emptyTally()
      addRating(tally, rating)
      addRating(overall, rating)
      byArea.set(area, tally)
    }
  }
  const rank = (a: string) => {
    const i = areaOrder.indexOf(a)
    return i < 0 ? areaOrder.length : i
  }
  return {
    overall,
    byArea: [...byArea]
      .map(([area, t]) => ({ area, ...t }))
      .sort(
        (a, b) => rank(a.area) - rank(b.area) || a.area.localeCompare(b.area),
      ),
  }
}
