import type { ReactNode } from 'react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface QueryLike {
  isPending: boolean
  isError: boolean
  refetch: () => unknown
}

/** Skeleton placeholder shown while data loads. */
function LoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-24 rounded-card" />
      <div className="skeleton h-24 rounded-card" />
      <div className="skeleton h-24 rounded-card" />
    </div>
  )
}

/** Shared loading/error wrapper for react-query results. */
export function QueryState({
  queries,
  children,
}: {
  queries: QueryLike[]
  children: ReactNode
}) {
  const failed = queries.filter((q) => q.isError)
  if (failed.length > 0) {
    return (
      <EmptyState
        title="Could not load data"
        description="Something went wrong. Check your connection and try again."
        action={
          <Button
            variant="secondary"
            onClick={() => failed.forEach((q) => q.refetch())}
          >
            Try again
          </Button>
        }
      />
    )
  }
  if (queries.some((q) => q.isPending)) return <LoadingSkeleton />
  return <>{children}</>
}
