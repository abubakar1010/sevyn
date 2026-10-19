import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import { useCreateOrganisation, useOrganisations } from '@/data/hooks'
import { formatDate } from '@/lib/format'

export function OrganisationsPage() {
  const orgs = useOrganisations()
  const create = useCreateOrganisation()
  const [open, setOpen] = useState(false)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    create.mutate(
      {
        name: String(f.get('name')).trim(),
        firstAdminEmail: String(f.get('email')).trim(),
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      <PageHeader
        title="Organisations"
        description="Provider organisations. Each is a separate tenant whose data is isolated from every other."
        actions={
          <Button onClick={() => setOpen(true)}>Create organisation</Button>
        }
      />
      <QueryState queries={[orgs]}>
        {orgs.data?.length === 0 ? (
          <EmptyState title="No organisations yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {orgs.data?.map((o) => (
                <tr key={o.id}>
                  <Td className="font-medium">{o.name}</Td>
                  <Td>{formatDate(o.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </QueryState>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create organisation"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Organisation name">
            {(p) => <Input name="name" required {...p} />}
          </Field>
          <Field
            label="First admin email"
            hint="This person receives the invitation to set up the tenant."
          >
            {(p) => <Input name="email" type="email" required {...p} />}
          </Field>
          <Button type="submit" disabled={create.isPending}>
            Create
          </Button>
        </form>
      </Modal>
    </>
  )
}
