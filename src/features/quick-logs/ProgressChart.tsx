import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'
import type { QuickLog } from '@/types'
import { buildProgressSeries, valueAt } from './progress'

const W = 640
const H = 280
const M = { top: 16, right: 20, bottom: 36, left: 40 }
const PLOT_W = W - M.left - M.right
const PLOT_H = H - M.top - M.bottom
const SERIES_COUNT = 6

/** Series colours come from CSS variables so light and dark each get their own validated steps. */
const seriesColor = (i: number) => `var(--series-${(i % SERIES_COUNT) + 1})`

const dayLabel = (time: number) =>
  new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/**
 * Progress over time for one young person, built from rated daily logs.
 * Each line is a progress area; it rises when logs show progress and falls when they show decline.
 */
export function ProgressChart({ logs }: { logs: QuickLog[] }) {
  const series = buildProgressSeries(logs)
  const [active, setActive] = useState<number | null>(null)
  const titleId = useId()

  if (series.length === 0) {
    return (
      <Card className="mb-6">
        <h2 className="text-lg font-semibold">Progress</h2>
        <p className="mt-1 text-sm text-slate-600">
          No rated logs yet. When you write a log, rate each progress area as
          Declined, No change or Progressing to build this graph.
        </p>
      </Card>
    )
  }

  const times = [
    ...new Set(series.flatMap((s) => s.points.map((p) => p.time))),
  ].sort((a, b) => a - b)
  const totals = series.flatMap((s) => s.points.map((p) => p.total))
  const lo = Math.min(0, ...totals)
  const hi = Math.max(0, ...totals)
  const yMin = lo - (lo === hi ? 1 : 0)
  const yMax = hi + (lo === hi ? 1 : 0)
  const tMin = times[0]
  const tMax = times[times.length - 1]

  const x = (t: number) =>
    M.left +
    (tMax === tMin ? PLOT_W / 2 : ((t - tMin) / (tMax - tMin)) * PLOT_W)
  const y = (v: number) =>
    M.top + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H
  const yTicks = Array.from(
    { length: yMax - yMin + 1 },
    (_, i) => yMin + i,
  ).filter((_, i, all) => all.length <= 7 || i % 2 === 0)
  const xTicks = [
    ...new Set([0, Math.floor((times.length - 1) / 2), times.length - 1]),
  ]

  function onPointerMove(e: PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * PLOT_W + M.left
    let nearest = 0
    times.forEach((t, i) => {
      if (Math.abs(x(t) - px) < Math.abs(x(times[nearest]) - px)) nearest = i
    })
    setActive(nearest)
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === 'ArrowRight')
      setActive((a) => Math.min((a ?? -1) + 1, times.length - 1))
    else if (e.key === 'ArrowLeft') setActive((a) => Math.max((a ?? 1) - 1, 0))
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  const activeTime = active === null ? null : times[active]

  return (
    <Card className="progress-root mb-6">
      <h2 id={titleId} className="text-lg font-semibold">
        Progress over time
      </h2>
      <p className="text-sm text-slate-600">
        Built from rated daily logs. A line rises with progress and falls with
        decline.
      </p>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {series.map((s, i) => (
          <li key={s.area} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-0.5 w-5 rounded-full"
              style={{ background: seriesColor(i) }}
            />
            {s.area}
          </li>
        ))}
      </ul>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby={titleId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          className="h-auto w-full touch-pan-y text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y(v)}
                y2={y(v)}
                stroke="currentColor"
                strokeOpacity={v === 0 ? 0.6 : 0.2}
                strokeWidth={1}
              />
              <text
                x={M.left - 8}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="currentColor"
              >
                {v}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text
              key={i}
              x={x(times[i])}
              y={H - 12}
              textAnchor={
                i === 0 && times.length > 1
                  ? 'start'
                  : i === times.length - 1 && times.length > 1
                    ? 'end'
                    : 'middle'
              }
              fontSize={11}
              fill="currentColor"
            >
              {dayLabel(times[i])}
            </text>
          ))}
          <text
            x={12}
            y={M.top + PLOT_H / 2}
            transform={`rotate(-90 12 ${M.top + PLOT_H / 2})`}
            textAnchor="middle"
            fontSize={11}
            fill="currentColor"
          >
            Running total (progress − decline)
          </text>

          {series.map((s, i) => (
            <g key={s.area}>
              <polyline
                fill="none"
                stroke={seriesColor(i)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={s.points
                  .map((p) => `${x(p.time)},${y(p.total)}`)
                  .join(' ')}
              />
              {s.points.map((p) => (
                <circle
                  key={p.time}
                  cx={x(p.time)}
                  cy={y(p.total)}
                  r={4}
                  fill={seriesColor(i)}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              ))}
            </g>
          ))}

          {activeTime !== null && (
            <line
              x1={x(activeTime)}
              x2={x(activeTime)}
              y1={M.top}
              y2={M.top + PLOT_H}
              stroke="currentColor"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          )}
          <rect
            x={M.left}
            y={M.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {activeTime !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-line bg-surface p-3 text-sm shadow-lift"
            style={{
              left: `${Math.min(Math.max((x(activeTime) / W) * 100, 18), 82)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="mb-1 font-medium text-slate-900">
              {formatDate(new Date(activeTime).toISOString().slice(0, 10))}
            </p>
            <ul className="flex flex-col gap-0.5">
              {series.map((s, i) => {
                const v = valueAt(s, activeTime)
                return (
                  <li key={s.area} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-0.5 w-3 rounded-full"
                      style={{ background: seriesColor(i) }}
                    />
                    <span className="font-semibold text-slate-900">
                      {v === null ? '—' : v}
                    </span>
                    <span className="text-slate-600">{s.area}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1 pr-4 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.area} className="py-1 pr-4 font-medium">
                    {s.area}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((t) => (
                <tr key={t} className="border-t border-line">
                  <td className="py-1 pr-4">
                    {formatDate(new Date(t).toISOString().slice(0, 10))}
                  </td>
                  {series.map((s) => (
                    <td key={s.area} className="py-1 pr-4">
                      {valueAt(s, t) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  )
}
