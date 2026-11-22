export type Role =
  'responsible_individual' | 'registered_manager' | 'support_worker'

export type Rag = 'red' | 'amber' | 'green'

export interface Profile {
  id: string
  organisationId: string
  role: Role
  fullName: string
  /** Homes this user may access. Empty for Responsible Individuals (all homes in the organisation). */
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
  /** Values for the company's own home fields, keyed by field id. Empty values are not stored. */
  customFields?: Record<string, string>
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
  /** Certificate evidencing the training. */
  certificateFileName?: string
}

/** A training column on the matrix; companies add their own beyond the defaults. */
export interface TrainingCourse {
  id: string
  name: string
}

export interface InterimMeasure {
  id: string
  itemKey: string
  note: string
  createdAt: string
  active: boolean
}

/** Profile details an Ofsted inspection file needs, grouped in the UI. */
export interface YoungPersonProfile {
  preferredName: string
  gender: string
  ethnicity: string
  nhsNumber: string
  legalStatus: string
  placingAuthority: string
  /** Placement Plan / care status, e.g. looked after (S20) or care leaver. */
  careStatus: string
  consents: string
  iroName: string
  iroContact: string
  /** Personal Adviser (leaving care). */
  personalAdviserName: string
  personalAdviserContact: string
  keyWorker: string
  socialWorkerName: string
  socialWorkerEmail: string
  socialWorkerPhone: string
  socialWorkerOffice: string
  nextOfKin: string
  contactRestrictions: string
  /** Any other professionals or appropriate contacts. */
  otherContacts: string
  school: string
  schoolContact: string
  gpSurgery: string
  allergiesMedical: string
  ehcpStatus: string
  missingRisk: string
  abscondingProtocol: string
}

export interface YoungPerson extends YoungPersonProfile {
  id: string
  homeId: string
  initials: string
  fullName: string
  dateOfBirth: string
  /** Date the young person moved into the home. */
  moveInDate: string
  /** Unit within the home, if the home is split into units. */
  unitId?: string | null
  restricted: boolean
  archived?: boolean
}

export interface QuickLog {
  id: string
  homeId: string
  youngPersonId: string
  authorId: string
  /** When the entry was written into the system. */
  createdAt: string
  /** When the event actually happened; may be earlier than `createdAt`. */
  occurredAt: string
  tags: string[]
  /** Per progress area: -1 declined, 0 no change, 1 progressing. Drives the progress graph. */
  ratings?: Record<string, -1 | 0 | 1>
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
  /** Chosen from the company's category list for the owner type. */
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

export type HomeFieldType =
  'text' | 'long_text' | 'number' | 'date' | 'yes_no' | 'dropdown'

/** A heading the company groups its own home fields under. */
export interface HomeFieldSection {
  id: string
  name: string
}

/** A field the company has added to every home's profile. */
export interface HomeFieldDefinition {
  id: string
  label: string
  /** Fixed once created, so saved values always match their type. */
  type: HomeFieldType
  sectionId: string
  required: boolean
  /** Choices for dropdown fields. */
  options?: string[]
  /** Date fields only: shows on the dashboard like a DBS or policy date. */
  trackExpiry?: boolean
  /** Retired fields are hidden but keep their saved values. */
  archived?: boolean
}

/** Sections and fields are shown in the order they are listed. */
export interface HomeFieldConfig {
  sections: HomeFieldSection[]
  fields: HomeFieldDefinition[]
}

/** Inspection groups a young person's records are filed under in Ofsted Mode. */
export type QualityStandardGroupId =
  'placement' | 'contacts' | 'plans' | 'safeguarding' | 'progress'

/** Pages whose built-in names a company can rename. */
export type LabelScope = 'staff' | 'homes'

export interface OrgSettings {
  name: string
  /** Days before expiry that a compliance item turns amber. */
  amberDays: number
  /** Document categories per file type; each company names its own. */
  documentCategories: Record<DocumentOwner, string[]>
  /** Which Quality Standard group each young people's document category belongs to. */
  youngPersonCategoryGroups: Record<string, QualityStandardGroupId>
  /** The company's own names for built-in labels, per page; only renamed ones are stored. */
  labels: Record<LabelScope, Record<string, string>>
  /** Extra fields every home carries; each company defines its own. */
  homeFields: HomeFieldConfig
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
