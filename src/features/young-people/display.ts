import type { Role, YoungPerson } from '@/types'

/** Ofsted Mode shows initials only, so other young people's names are never exposed. */
export function youngPersonName(yp: YoungPerson, ofsted: boolean): string {
  return ofsted ? yp.initials : yp.fullName
}

/** Support workers never receive restricted records; this guards the UI as well as the API. */
export function canViewRestricted(role: Role): boolean {
  return role !== 'support_worker'
}
