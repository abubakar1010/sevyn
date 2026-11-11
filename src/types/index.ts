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
  /** Ofsted unique reference number. */
  ofstedUrn: string
  approvedCapacity: number
  phone: string
  outOfHoursPhone: string
  managerName: string
  managerEmail: string
  managerPhone: string
  /** Local authority / LADO contact details. */
  laContact: string
  ageRange: string
  genderPermitted: string
}

/** Editable home profile fields (everything except the id). */
export type HomeInput = Omit<Home, 'id'>

export interface StaffMember {
  id: string
  homeId: string
  fullName: string
  jobTitle: string
  address: string
  dbsRecheckDate: string | null
  safeguardingExpiry: string | null
  /** Set by the manager once every compliance requirement for this company is met. */
  compliantToWork: boolean
  /** What is missing when the staff member is not yet compliant. */
  complianceNote: string
  /** Archived staff leave active lists and compliance, but are kept for the audit trail. */
  archived?: boolean
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
  archived?: boolean
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

export type DocumentOwner = 'home' | 'staff' | 'young_person'

/** A file held on a home, staff member or young person's file. */
export interface DocumentRecord {
  id: string
  homeId: string
  ownerType: DocumentOwner
  ownerId: string
  title: string
  /** Chosen from the fixed category list for the owner type. */
  category: string
  fileName: string
  uploadedAt: string
  expiresOn?: string | null
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
  /** When the next audit is due (weekly, monthly, 6-monthly, yearly: the company decides). */
  expiryDate: string | null
  /** Scanned paper audit, or feedback from a local authority / Ofsted / internal audit. */
  feedbackFileName?: string
}

export interface Policy {
  id: string
  title: string
  lastReviewed: string
  /** Date the policy expires and must be reviewed again. */
  reviewDue: string
  fileName?: string
  /** Support workers only see policies a manager has shared with them. */
  visibleToWorkers: boolean
}
