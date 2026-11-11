import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useAddPolicy,
  useAmberDays,
  useMarkPolicyReviewed,
  usePolicies,
  useSetPolicyVisibility,
} from '@/data/hooks'
import { formatDate } from '@/lib/format'
import { ragForDate } from '@/lib/rag'
import { useCanEdit } from '@/lib/useCanEdit'
import type { Policy } from '@/types'

export function PoliciesPage() {
  const canEdit = useCanEdit()
  const policies = usePolicies()
  const amberDays = useAmberDays()
  const add = useAddPolicy()
  const reviewed = useMarkPolicyReviewed()
  const visibility = useSetPolicyVisibility()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<Policy | null>(null)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const file = f.get('file') as File
    add.mutate(
      {
        title: String(f.get('title')).trim(),
        reviewDue: String(f.get('reviewDue')),
        fileName: file.name,
        visibleToWorkers: f.get('visibleToWorkers') === 'on',
      },
      { onSuccess: () => setUploadOpen(false) },
    )
  }

  return (
    <>
      <PageHeader
        title="Policies"
        description={
          canEdit
            ? 'Upload your policies with an expiry date, and choose which ones support workers can see.'
            : 'Policies shared with you by your manager.'
        }
        actions={
          canEdit && (
            <Button onClick={() => setUploadOpen(true)}>Upload policy</Button>
          )
        }
      />
      <QueryState queries={[policies]}>
        {policies.data?.length === 0 ? (
          <EmptyState title="No policies" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Policy</Th>
                <Th>Last reviewed</Th>
                <Th>Expires</Th>
                <Th>Support workers</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {policies.data?.map((p) => (
                <tr key={p.id}>
                  <Td label="Policy" className="font-medium">
                    {p.title}
                  </Td>
                  <Td label="Last reviewed">{formatDate(p.lastReviewed)}</Td>
                  <Td label="Expires">
                    <div className="flex flex-col items-start gap-1">
                      <RagBadge
                        status={ragForDate(
                          new Date(p.reviewDue),
                          undefined,
                          amberDays,
                        )}
                      />
                      <span className="text-slate-600">
                        {formatDate(p.reviewDue)}
                      </span>
                    </div>
                  </Td>
                  <Td label="Support workers">
                    {canEdit ? (
                      <label className="flex min-h-11 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.visibleToWorkers}
                          disabled={visibility.isPending}
                          aria-label={`Share ${p.title} with support workers`}
                          onChange={(e) =>
                            visibility.mutate({
                              id: p.id,
                              visibleToWorkers: e.target.checked,
                            })
                          }
                          className="size-5 accent-primary-700"
                        />
                        <span>Can view</span>
                      </label>
                    ) : (
                      <Badge>Shared</Badge>
                    )}
                  </Td>
                  <Td>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Open ${p.title}`}
                      onClick={() => setViewing(p)}
                    >
                      Open
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Mark ${p.title} reviewed`}
                        disabled={reviewed.isPending}
                        onClick={() => reviewed.mutate({ id: p.id })}
                      >
                        Mark reviewed
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </QueryState>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload policy"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Policy title">
            {(p) => <Input name="title" required {...p} />}
          </Field>
          <Field
            label="File"
            hint="Demo: only the file name is recorded; nothing is uploaded."
          >
            {(p) => <Input name="file" type="file" required {...p} />}
          </Field>
          <Field
            label="Expiry date"
            hint="When this policy must next be reviewed."
          >
            {(p) => <Input name="reviewDue" type="date" required {...p} />}
          </Field>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="visibleToWorkers"
              className="size-5 accent-primary-700"
            />
            <span>Visible to support workers</span>
          </label>
          <FormError error={add.error} />
          <Button type="submit" disabled={add.isPending}>
            Upload
          </Button>
        </form>
      </Modal>
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ''}
      >
        <p className="mb-4 text-slate-700">
          In production this opens{' '}
          <span className="font-medium">{viewing?.fileName ?? 'the file'}</span>{' '}
          through a time-limited signed URL from private storage. File storage
          isn't connected in this demo.
        </p>
        <Button onClick={() => setViewing(null)}>Close</Button>
      </Modal>
    </>
  )
}
