import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { RagBadge } from '@/components/ui/RagBadge'
import { Table, Td, Th } from '@/components/ui/Table'

/** Dev-only style reference at /design. */
export function DesignPage() {
  const [open, setOpen] = useState(false)
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-8">
      <PageHeader
        title="Design system"
        description="Sevyn UI building blocks."
        actions={<Button onClick={() => setOpen(true)}>Open modal</Button>}
      />
      <Card className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabled</Button>
      </Card>
      <Card className="flex flex-wrap gap-3">
        <RagBadge status="red" />
        <RagBadge status="amber" />
        <RagBadge status="green" />
        <Badge>Neutral</Badge>
        <Badge tone="info">Info</Badge>
      </Card>
      <Card className="flex flex-col gap-4">
        <Field label="Full name" hint="As on DBS certificate">
          {(p) => <Input {...p} />}
        </Field>
        <Field label="Email" error="Enter a valid email">
          {(p) => <Input type="email" defaultValue="nope" {...p} />}
        </Field>
        <Field label="Home">
          {(p) => (
            <Select {...p}>
              <option>Oakview House</option>
            </Select>
          )}
        </Field>
        <Field label="Notes">{(p) => <Textarea {...p} />}</Field>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Staff member</Th>
            <Th>DBS recheck</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td label="Staff member">Sample Person A</Td>
            <Td label="DBS recheck">12 Jan 2027</Td>
            <Td label="Status">
              <RagBadge status="green" />
            </Td>
          </tr>
          <tr>
            <Td label="Staff member">Sample Person B</Td>
            <Td label="DBS recheck">02 Nov 2026</Td>
            <Td label="Status">
              <RagBadge status="amber" />
            </Td>
          </tr>
        </tbody>
      </Table>
      <EmptyState
        title="No tasks yet"
        description="Tasks assigned to you will appear here."
        action={<Button variant="secondary">Create task</Button>}
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Example modal">
        <p className="mb-4 text-slate-700">
          Native dialog with focus trapping.
        </p>
        <Button onClick={() => setOpen(false)}>Done</Button>
      </Modal>
    </main>
  )
}
