import type { Role } from '@/types'

export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/admin',
  registered_manager: '/manager',
  support_worker: '/worker',
}
