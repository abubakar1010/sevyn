import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { useAddDocument, useDeleteDocument, useDocuments } from '@/data/hooks'
import { formatDate } from '@/lib/format'
import { useCanEdit } from '@/lib/useCanEdit'
import type { DocumentOwner, DocumentRecord } from '@/types'
import { DOCUMENT_CATEGORIES } from './categories'

/** Documents filed against one home, staff member or young person, grouped by category. */
export function DocumentsPanel({
  ownerType,
  ownerId,
  homeId,
}: {
  ownerType: DocumentOwner
  ownerId: string
  homeId: string
}) {
  const canEdit = useCanEdit()
  const docs = useDocuments()
  const add = useAddDocument()
  const remove = useDeleteDocument()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null)
  const categories = DOCUMENT_CATEGORIES[ownerType]

  const mine = (docs.data ?? []).filter(
    (d) => d.ownerType === ownerType && d.ownerId === ownerId,
  )
  const used = categories.filter((c) => mine.some((d) => d.category === c))

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const file = f.get('file') as File
    add.mutate(
      {
        homeId,
        ownerType,
        ownerId,
        title: String(f.get('title')).trim(),
        category: String(f.get('category')),
        fileName: file.name,
        expiresOn: String(f.get('expiresOn') || '') || null,
      },
      { onSuccess: () => setUploadOpen(false) },
    )
  }

  return (
    <section aria-label="Documents" className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Documents</h3>
        {canEdit && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            Upload document
          </Button>
        )}
      </div>
      <QueryState queries={[docs]}>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-600">No documents uploaded yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {used.map((c) => (
              <div key={c}>
                <p className="mb-1 text-sm font-medium text-slate-800">{c}</p>
                <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                  {mine
                    .filter((d) => d.category === c)
                    .map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        <span>
                          <span className="font-medium">{d.title}</span>
                          <span className="block text-slate-600">
                            {d.fileName} · uploaded {formatDate(d.uploadedAt)}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          {d.expiresOn && (
                            <Badge>Expires {formatDate(d.expiresOn)}</Badge>
                          )}
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
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </QueryState>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload document"
      >
        {uploadOpen && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Title">
              {(p) => <Input name="title" required {...p} />}
            </Field>
            <Field label="Category">
              {(p) => (
                <Select name="category" {...p}>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
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
            <Field label="Expiry date" hint="Optional">
              {(p) => <Input name="expiresOn" type="date" {...p} />}
            </Field>
            <FormError error={add.error} />
            <Button type="submit" disabled={add.isPending}>
              Upload
            </Button>
          </form>
        )}
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
    </section>
  )
}
