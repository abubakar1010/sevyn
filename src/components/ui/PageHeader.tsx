import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="relative pl-4">
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 w-1 rounded-full bg-linear-to-b from-primary-500 to-accent-500"
        />
        <h1 className="text-3xl font-semibold tracking-tight text-primary-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-prose text-slate-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  )
}
