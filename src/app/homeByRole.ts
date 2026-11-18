import type { Role } from '@/types'

export const HOME_BY_ROLE: Record<Role, string> = {
  responsible_individual: '/responsible-individual',
  registered_manager: '/manager',
  support_worker: '/worker',
}
