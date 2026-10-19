import type { Rag } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Red when expired, amber when due within `amberDays`, otherwise green. Missing date is red. */
export function ragForDate(
  due: Date | null,
  now = new Date(),
  amberDays = 30,
): Rag {
  if (!due) return 'red'
  const remaining = due.getTime() - now.getTime()
  if (remaining < 0) return 'red'
  if (remaining <= amberDays * DAY_MS) return 'amber'
  return 'green'
}

const ORDER: Rag[] = ['green', 'amber', 'red']

/** Worst status wins. */
export function worstRag(statuses: Rag[]): Rag {
  return statuses.reduce<Rag>(
    (worst, s) => (ORDER.indexOf(s) > ORDER.indexOf(worst) ? s : worst),
    'green',
  )
}
