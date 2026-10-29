import { cn } from '@/lib/cn'

const BRAND_BLUE = '#3f83f4'

/** The "S" mark: two interlocking hexagonal bands. */
export function LogoMark({
  className,
  title,
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 308 357"
      className={cn('h-8 w-auto', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g fill={BRAND_BLUE}>
        <polygon points="50,0 257,0 308,89 103,89 154,178 50,178 0,89" />
        <polygon points="154,178 257,178 308,268 257,357 50,357 0,268 204,268" />
      </g>
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
          'font-sans text-[1.75rem] leading-none font-bold tracking-tight',
          light ? 'text-white' : 'text-[#111827] dark:text-white',
        )}
      >
        Sevyn
      </span>
    </span>
  )
}
