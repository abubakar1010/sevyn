import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift, for cards that summarise something you can act on. */
  interactive?: boolean
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface p-4 shadow-card md:p-5',
        interactive &&
          'transition duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lift dark:hover:border-primary-500',
        className,
      )}
      {...props}
    />
  )
}
