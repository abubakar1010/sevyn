import { useState, type FormEvent } from 'react'
import { useAuth } from '@/app/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { Table, Td, Th } from '@/components/ui/Table'
import { useHomes, useSaveUser, useSetUserActive, useUsers } from '@/data/hooks'
import type { AppUser, Role } from '@/types'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  registered_manager: 'Registered Manager',
  support_worker: 'Support Worker',
}

type Editing = AppUser | 'new' | null

export function UsersPage() {
  const { profile } = useAuth()
  const users = useUsers()
  const homes = useHomes()
  const save = useSaveUser()
  const setActive = useSetUserActive()
  const [editing, setEditing] = useState<Editing>(null)
  const [role, setRole] = useState<Role>('support_worker')
  const current = editing && editing !== 'new' ? editing : null

  function open(target: Editing) {
    setRole(target && target !== 'new' ? target.role : 'support_worker')
    setEditing(target)
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    save.mutate(
      {
        id: current?.id,
        fullName: String(f.get('fullName')).trim(),
        email: String(f.get('email')).trim(),
        role,
        homeIds: f.getAll('homeIds').map(String),
      },
      { onSuccess: () => setEditing(null) },
    )
  }

  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Manage Registered Managers and Support Workers and which homes each can access."
        actions={<Button onClick={() => open('new')}>Invite user</Button>}
      />
      <QueryState queries={[users, homes]}>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Homes</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id}>
                <Td label="Name" className="font-medium">
                  {u.fullName}
                </Td>
                <Td label="Email">{u.email}</Td>
                <Td label="Role">{ROLE_LABEL[u.role]}</Td>
                <Td label="Homes">
                  {u.role === 'admin'
                    ? 'All homes'
                    : u.homeIds
                        .map((id) => homes.data?.find((h) => h.id === id)?.name)
                        .join(', ') || 'None'}
                </Td>
                <Td label="Status">
                  {u.active ? (
                    <Badge tone="info">Active</Badge>
                  ) : (
                    <Badge>Deactivated</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${u.fullName}`}
                      onClick={() => open(u)}
                    >
                      Edit
                    </Button>
                    {u.id !== profile?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${u.active ? 'Deactivate' : 'Reactivate'} ${u.fullName}`}
                        onClick={() =>
                          setActive.mutate({ id: u.id, active: !u.active })
                        }
                      >
                        {u.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </QueryState>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? 'Edit user' : 'Invite user'}
      >
        {editing !== null && (
          <form
            key={current?.id ?? 'new'}
            onSubmit={submit}
            className="flex flex-col gap-4"
          >
            <Field label="Full name">
              {(p) => (
                <Input
                  name="fullName"
                  required
                  defaultValue={current?.fullName}
                  {...p}
                />
              )}
            </Field>
            <Field label="Email">
              {(p) => (
                <Input
                  name="email"
                  type="email"
                  required
                  defaultValue={current?.email}
                  {...p}
                />
              )}
            </Field>
            <Field
              label="Role"
              hint={
                role === 'support_worker'
                  ? 'Signs in with an emailed one-time code.'
                  : 'Signs in with password and authenticator app.'
              }
            >
              {(p) => (
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  {...p}
                >
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {role !== 'admin' && (
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-slate-800">
                  Homes this user can access
                </legend>
                {homes.data?.map((h) => (
                  <label
                    key={h.id}
                    className="flex min-h-11 items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      name="homeIds"
                      value={h.id}
                      defaultChecked={current?.homeIds.includes(h.id)}
                      className="size-5 accent-primary-700"
                    />
                    {h.name}
                  </label>
                ))}
              </fieldset>
            )}
            <FormError error={save.error} />
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
          </form>
        )}
      </Modal>
    </>
  )
}
