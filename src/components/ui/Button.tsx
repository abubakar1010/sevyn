import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900',
  secondary:
    'border border-slate-300 bg-surface text-slate-800 hover:bg-slate-50',
  ghost:
    'text-primary-700 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-white/10',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}
const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 text-base',
  sm: 'min-h-11 px-3 text-sm md:min-h-9',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
