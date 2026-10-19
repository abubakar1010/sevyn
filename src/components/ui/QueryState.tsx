import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

/** Shared loading/error wrapper for react-query results. */
export function QueryState({
  queries,
  children,
}: {
  queries: { isPending: boolean; isError: boolean }[]
  children: ReactNode
}) {
  if (queries.some((q) => q.isError))
    return (
      <EmptyState title="Could not load data" description="Please try again." />
    )
  if (queries.some((q) => q.isPending)) return <p role="status">Loading…</p>
  return <>{children}</>
}
