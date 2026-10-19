import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const CONTROL =
  'block w-full rounded-lg border border-slate-300 bg-surface px-3 text-base text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 aria-[invalid=true]:border-red-600'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => ReactNode
}

/** Label + control + hint/error wrapper. Pass a render function so ids and aria stay wired. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const describedBy = error || hint ? `${id}-desc` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
      })}
      {(error || hint) && (
        <p
          id={describedBy}
          className={cn(
            'text-sm',
            error ? 'text-red-700 dark:text-red-300' : 'text-slate-600',
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'min-h-11', className)} {...props} />
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'min-h-11', className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(CONTROL, 'min-h-24 py-2', className)} {...props} />
  )
}
