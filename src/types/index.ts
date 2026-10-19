export type Role = 'admin' | 'registered_manager' | 'support_worker'

export type Rag = 'red' | 'amber' | 'green'

export interface Profile {
  id: string
  organisationId: string
  role: Role
  fullName: string
  /** Homes this user may access. Empty for admins (all homes in the organisation). */
  homeIds: string[]
}

/** Dates are ISO `YYYY-MM-DD` strings. */
export interface Home {
  id: string
  name: string
  address: string
}

export interface StaffMember {
  id: string
  homeId: string
  fullName: string
  jobTitle: string
  address: string
  dbsRecheckDate: string | null
  safeguardingExpiry: string | null
}

export interface TrainingRecord {
  id: string
  staffId: string
  course: string
  completedOn: string
  expiresOn: string | null
}

export interface InterimMeasure {
  id: string
  itemKey: string
  note: string
  createdAt: string
  active: boolean
}

export interface YoungPerson {
  id: string
  homeId: string
  initials: string
  fullName: string
  dateOfBirth: string
  restricted: boolean
}

export interface QuickLog {
  id: string
  homeId: string
  youngPersonId: string
  authorId: string
  createdAt: string
  tags: string[]
  note: string
}

export interface Task {
  id: string
  homeId: string
  title: string
  assigneeId: string
  dueDate: string
  done: boolean
}

export interface ComplianceItem {
  key: string
  homeId: string
  subject: string
  label: string
  due: string | null
  status: Rag
  interimMeasure?: InterimMeasure
}

export interface Unit {
  id: string
  homeId: string
  name: string
  capacity: number
}

export type DocumentCategory = 'Policy' | 'Compliance' | 'Training'

export interface DocumentRecord {
  id: string
  homeId: string
  title: string
  category: DocumentCategory
  fileName: string
  uploadedAt: string
}

/** Append-only: the API exposes no update or delete for these. */
export interface AuditEntry {
  id: string
  at: string
  actorName: string
  action: string
  target: string
  homeId?: string
}

export interface Organisation {
  id: string
  name: string
  createdAt: string
}

export interface AppUser {
  id: string
  fullName: string
  email: string
  role: Role
  homeIds: string[]
  active: boolean
}

export interface OrgSettings {
  name: string
  /** Days before expiry that a compliance item turns amber. */
  amberDays: number
}

export interface Audit {
  id: string
  homeId: string
  title: string
  auditDate: string
  /** What must be done as a result of the audit. */
  requiredAction: string
  resolved: boolean
}

export interface Policy {
  id: string
  title: string
  lastReviewed: string
  reviewDue: string
}
