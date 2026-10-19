import { useId } from 'react'
import { cn } from '@/lib/cn'

const DOTS = 7
const RADIUS = 9

/** Seven dots in a ring (a nod to the name); the top dot leads. */
export function LogoMark({
  className,
  title,
}: {
  className?: string
  title?: string
}) {
  const gradient = useId()
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-9', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-primary-500)" />
          <stop offset="1" stopColor="var(--color-accent-700)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradient})`} />
      {Array.from({ length: DOTS }, (_, i) => {
        const angle = ((-90 + (i * 360) / DOTS) * Math.PI) / 180
        return (
          <circle
            key={i}
            cx={16 + RADIUS * Math.cos(angle)}
            cy={16 + RADIUS * Math.sin(angle)}
            r={i === 0 ? 2.7 : 1.9}
            fill="white"
            opacity={i === 0 ? 1 : 0.78}
          />
        )
      })}
    </svg>
  )
}

export function Logo({
  className,
  light = false,
}: {
  className?: string
  light?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span
        className={cn(
          'font-display text-2xl leading-none font-semibold tracking-tight',
          light ? 'text-white' : 'text-primary-900',
        )}
      >
        Sevyn
      </span>
    </span>
  )
}
