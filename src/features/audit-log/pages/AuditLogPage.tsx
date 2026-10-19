import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import { useAuditLog, useHomes } from '@/data/hooks'
import { formatDateTime } from '@/lib/format'

export function AuditLogPage() {
  const log = useAuditLog()
  const homes = useHomes()
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only record of changes. Entries cannot be edited or deleted."
      />
      <QueryState queries={[log, homes]}>
        {log.data?.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Home</Th>
              </tr>
            </thead>
            <tbody>
              {log.data?.map((e) => (
                <tr key={e.id}>
                  <Td label="When">{formatDateTime(e.at)}</Td>
                  <Td label="Who">{e.actorName}</Td>
                  <Td label="Action">{e.action}</Td>
                  <Td label="Target">{e.target}</Td>
                  <Td label="Home">
                    {homes.data?.find((h) => h.id === e.homeId)?.name ?? '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </QueryState>
    </>
  )
}
