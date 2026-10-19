import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormError } from '@/components/ui/FormError'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import {
  useAddDocument,
  useDeleteDocument,
  useDocuments,
  useHomes,
} from '@/data/hooks'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { DocumentCategory, DocumentRecord } from '@/types'

const CATEGORIES: DocumentCategory[] = ['Policy', 'Compliance', 'Training']

export function DocumentsPage() {
  const canEdit = useCanEdit()
  const docs = useDocuments()
  const homes = useHomes()
  const add = useAddDocument()
  const remove = useDeleteDocument()
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<DocumentRecord | null>(null)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const file = f.get('file') as File
    add.mutate(
      {
        homeId: String(f.get('homeId')),
        title: String(f.get('title')).trim(),
        category: String(f.get('category')) as DocumentCategory,
        fileName: file.name,
      },
      { onSuccess: () => setUploadOpen(false) },
    )
  }

  return (
    <>
      <PageHeader
        title="Documents & policies"
        description="Documents are held in private storage and opened through short-lived secure links."
        actions={
          canEdit && (
            <Button onClick={() => setUploadOpen(true)}>Upload document</Button>
          )
        }
      />
      <QueryState queries={[docs, homes]}>
        {docs.data?.length === 0 ? (
          <EmptyState title="No documents" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Home</Th>
                <Th>Uploaded</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {docs.data?.map((d) => (
                <tr key={d.id}>
                  <Td label="Title" className="font-medium">
                    {d.title}
                  </Td>
                  <Td label="Category">
                    <Badge>{d.category}</Badge>
                  </Td>
                  <Td label="Home">
                    {homes.data?.find((h) => h.id === d.homeId)?.name}
                  </Td>
                  <Td label="Uploaded">{formatDate(d.uploadedAt)}</Td>
                  <Td>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Open ${d.title}`}
                      onClick={() => setViewing(d)}
                    >
                      Open
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${d.title}`}
                        onClick={() => setDeleting(d)}
                      >
                        Delete
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
        title="Upload document"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Title">
            {(p) => <Input name="title" required {...p} />}
          </Field>
          <Field label="Category">
            {(p) => (
              <Select name="category" {...p}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Home">
            {(p) => (
              <Select name="homeId" {...p}>
                {homes.data?.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="File"
            hint="Demo: only the file name is recorded; nothing is uploaded."
          >
            {(p) => <Input name="file" type="file" required {...p} />}
          </Field>
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
          <span className="font-medium">{viewing?.fileName}</span> through a
          time-limited signed URL from private storage. File storage isn't
          connected in this demo.
        </p>
        <Button onClick={() => setViewing(null)}>Close</Button>
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete document"
        message={`Delete "${deleting?.title}"? The deletion is recorded in the audit log.`}
        confirmLabel="Delete document"
        pending={remove.isPending}
        error={remove.error}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          remove.mutate(
            { id: deleting!.id },
            { onSuccess: () => setDeleting(null) },
          )
        }
      />
    </>
  )
}
