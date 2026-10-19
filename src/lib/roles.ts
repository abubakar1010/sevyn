import type { Role } from '@/types'

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  registered_manager: 'Registered Manager',
  support_worker: 'Support Worker',
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
