import { useState } from 'react'
import { ProgressRing } from '@/components/ui/ProgressRing'

function greeting() {
  const hour = new Date().getHours()
  return hour < 12
    ? 'Good morning'
    : hour < 18
      ? 'Good afternoon'
      : 'Good evening'
}

interface Props {
  firstName: string
  percent: number
  red: number
  amber: number
}

/** Personal greeting with the overall compliance score drawn as a ring. */
export function ScoreHero({ firstName, percent, red, amber }: Props) {
  const [hello] = useState(greeting)
  const message =
    red > 0
      ? `${red} item${red === 1 ? '' : 's'} need${red === 1 ? 's' : ''} attention today.`
      : amber > 0
        ? `All clear, with ${amber} item${amber === 1 ? '' : 's'} coming up for renewal.`
        : 'Everything is on track.'
  return (
    <section
      aria-label="Overview"
      className="relative mb-6 flex items-center justify-between gap-6 overflow-hidden rounded-card bg-linear-to-br from-primary-800 via-primary-700 to-accent-700 bg-size-[160%_160%] p-6 text-white shadow-lift motion-safe:animate-gradient md:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-8 size-52 animate-float rounded-full bg-white/10 blur-2xl"
      />
      <div className="relative">
        <p className="text-sm text-white/75">{hello}</p>
        <p className="font-display text-3xl leading-tight font-semibold md:text-4xl">
          {firstName}
        </p>
        <p className="mt-2 max-w-xs text-white/85">{message}</p>
      </div>
      <ProgressRing percent={percent} label="compliant" />
    </section>
  )
}
