import type {
  AppUser,
  Audit,
  Policy,
  AuditEntry,
  OrgSettings,
  DocumentRecord,
  Home,
  InterimMeasure,
  QuickLog,
  StaffMember,
  Task,
  TrainingCourse,
  TrainingRecord,
  Unit,
  YoungPerson,
  YoungPersonProfile,
} from '@/types'

/** Demo tenant: all names are fictional. Dates are relative to today so RAG states stay demonstrable. */
export function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const homeProfile = (
  n: number,
  p: Pick<Home, 'ofstedUrn' | 'approvedCapacity' | 'ageRange'> &
    Pick<Home, 'managerName' | 'genderPermitted'>,
) => ({
  ...p,
  phone: `01234 50000${n}`,
  outOfHoursPhone: `07700 90000${n}`,
  managerEmail: `${p.managerName.split(' ')[0].toLowerCase()}@example.test`,
  managerPhone: `07700 91000${n}`,
  laContact: 'Demotown Council LADO, 01234 560000',
})

export const homes: Home[] = [
  {
    id: 'h1',
    name: 'Oakview House',
    address: '12 Oak Lane, Demotown',
    ...homeProfile(1, {
      ofstedUrn: 'SC100001',
      approvedCapacity: 5,
      ageRange: '16-18',
      managerName: 'Alex Morgan',
      genderPermitted: 'Mixed',
    }),
  },
  {
    id: 'h2',
    name: 'Riverside Lodge',
    address: '4 River Road, Demotown',
    ...homeProfile(2, {
      ofstedUrn: 'SC100002',
      approvedCapacity: 4,
      ageRange: '16-17',
      managerName: 'Casey Quinn',
      genderPermitted: 'Female',
    }),
  },
  {
    id: 'h3',
    name: 'Maple Court',
    address: '9 Maple Court, Exampleton',
    ...homeProfile(3, {
      ofstedUrn: 'SC100003',
      approvedCapacity: 3,
      ageRange: '16-18',
      managerName: 'Morgan Reid',
      genderPermitted: 'Male',
    }),
  },
]

export const staff: StaffMember[] = [
  {
    id: 's1',
    homeId: 'h1',
    fullName: 'Alex Morgan',
    jobTitle: 'Registered Manager',
    address: '1 Sample St',
    dbsRecheckDate: daysFromNow(200),
    safeguardingExpiry: daysFromNow(150),
    compliantToWork: true,
    complianceNote: '',
  },
  {
    id: 's2',
    homeId: 'h1',
    fullName: 'Sam Taylor',
    jobTitle: 'Support Worker',
    address: '2 Sample St',
    dbsRecheckDate: daysFromNow(14),
    safeguardingExpiry: daysFromNow(90),
    compliantToWork: true,
    complianceNote: '',
  },
  {
    id: 's3',
    homeId: 'h1',
    fullName: 'Jordan Lee',
    jobTitle: 'Support Worker',
    address: '3 Sample St',
    dbsRecheckDate: daysFromNow(300),
    safeguardingExpiry: daysFromNow(-5),
    compliantToWork: false,
    complianceNote: 'Application form missing from staff file.',
  },
  {
    id: 's4',
    homeId: 'h2',
    fullName: 'Casey Quinn',
    jobTitle: 'Registered Manager',
    address: '4 Sample St',
    dbsRecheckDate: daysFromNow(120),
    safeguardingExpiry: daysFromNow(60),
    compliantToWork: true,
    complianceNote: '',
  },
  {
    id: 's5',
    homeId: 'h2',
    fullName: 'Riley Evans',
    jobTitle: 'Support Worker',
    address: '5 Sample St',
    dbsRecheckDate: daysFromNow(45),
    safeguardingExpiry: daysFromNow(20),
    compliantToWork: true,
    complianceNote: '',
  },
  {
    id: 's6',
    homeId: 'h2',
    fullName: 'Taylor Brooks',
    jobTitle: 'Support Worker',
    address: '6 Sample St',
    dbsRecheckDate: null,
    safeguardingExpiry: daysFromNow(180),
    compliantToWork: false,
    complianceNote: 'Awaiting DBS and signed contract.',
  },
  {
    id: 's7',
    homeId: 'h3',
    fullName: 'Morgan Reid',
    jobTitle: 'Registered Manager',
    address: '7 Sample St',
    dbsRecheckDate: daysFromNow(250),
    safeguardingExpiry: daysFromNow(220),
    compliantToWork: true,
    complianceNote: '',
  },
  {
    id: 's8',
    homeId: 'h3',
    fullName: 'Avery Stone',
    jobTitle: 'Support Worker',
    address: '8 Sample St',
    dbsRecheckDate: daysFromNow(400),
    safeguardingExpiry: daysFromNow(300),
    compliantToWork: true,
    complianceNote: '',
  },
]

export const trainingRecords: TrainingRecord[] = [
  {
    id: 't1',
    staffId: 's2',
    course: 'First Aid',
    completedOn: daysFromNow(-350),
    expiresOn: daysFromNow(15),
    certificateFileName: 'first-aid-sam-taylor.pdf',
  },
  {
    id: 't2',
    staffId: 's3',
    course: 'First Aid',
    completedOn: daysFromNow(-400),
    expiresOn: daysFromNow(-35),
  },
  {
    id: 't3',
    staffId: 's5',
    course: 'Fire Safety',
    completedOn: daysFromNow(-100),
    expiresOn: daysFromNow(265),
  },
  {
    id: 't4',
    staffId: 's6',
    course: 'Medication',
    completedOn: daysFromNow(-60),
    expiresOn: daysFromNow(305),
  },
  {
    id: 't5',
    staffId: 's8',
    course: 'First Aid',
    completedOn: daysFromNow(-30),
    expiresOn: daysFromNow(335),
  },
]

export const trainingCourses: TrainingCourse[] = [
  { id: 'c1', name: 'First Aid' },
  { id: 'c2', name: 'Fire Safety' },
  { id: 'c3', name: 'Medication' },
]

export const interimMeasures: InterimMeasure[] = [
  {
    id: 'i1',
    itemKey: 'safeguarding:s3',
    note: 'Not to be left as sole carer on shift until refresher is completed. Booked for next week.',
    createdAt: daysFromNow(-4),
    active: true,
  },
]

export const profile = (
  over: Partial<YoungPersonProfile> = {},
): YoungPersonProfile => ({
  preferredName: '',
  gender: '',
  ethnicity: '',
  nhsNumber: '',
  legalStatus: '',
  placingAuthority: '',
  iroName: '',
  iroContact: '',
  keyWorker: '',
  socialWorkerName: '',
  socialWorkerEmail: '',
  socialWorkerPhone: '',
  socialWorkerOffice: '',
  nextOfKin: '',
  contactRestrictions: '',
  school: '',
  schoolContact: '',
  gpSurgery: '',
  allergiesMedical: '',
  ehcpStatus: '',
  missingRisk: '',
  abscondingProtocol: '',
  ...over,
})

export const youngPeople: YoungPerson[] = [
  {
    id: 'y1',
    homeId: 'h1',
    initials: 'A.B.',
    fullName: 'Demo Young Person One',
    dateOfBirth: '2010-04-02',
    restricted: false,
    ...profile({
      preferredName: 'Alex',
      gender: 'Male',
      nhsNumber: '000 000 0001',
      legalStatus: 'Section 20',
      placingAuthority: 'Demotown Council',
      keyWorker: 'Sam Taylor',
      socialWorkerName: 'Pat Demo',
      socialWorkerEmail: 'pat@example.test',
      socialWorkerPhone: '01234 560001',
      school: 'Demo College',
      allergiesMedical: 'Penicillin allergy',
      ehcpStatus: 'None',
    }),
  },
  {
    id: 'y2',
    homeId: 'h1',
    initials: 'C.D.',
    fullName: 'Demo Young Person Two',
    dateOfBirth: '2009-09-18',
    restricted: true,
    ...profile({
      legalStatus: 'Care Order',
      contactRestrictions: 'No contact with named adult',
    }),
  },
  {
    id: 'y3',
    homeId: 'h2',
    initials: 'E.F.',
    fullName: 'Demo Young Person Three',
    dateOfBirth: '2011-01-30',
    restricted: false,
    ...profile({ legalStatus: 'Section 20', ehcpStatus: 'In progress' }),
  },
]

export const quickLogs: QuickLog[] = [
  {
    id: 'q1',
    homeId: 'h1',
    youngPersonId: 'y1',
    authorId: 's2',
    createdAt: daysFromNow(-1),
    occurredAt: daysFromNow(-1),
    tags: ['Emotional Wellbeing'],
    note: 'Settled well after school; chose to join group activity.',
  },
  {
    id: 'q2',
    homeId: 'h2',
    youngPersonId: 'y3',
    authorId: 's5',
    createdAt: daysFromNow(-2),
    occurredAt: daysFromNow(-2),
    tags: ['Health'],
    note: 'Routine appointment attended.',
  },
]

export const tasks: Task[] = [
  {
    id: 'k1',
    homeId: 'h1',
    title: 'Book safeguarding refresher for Jordan Lee',
    assigneeId: 's1',
    dueDate: daysFromNow(5),
    done: false,
  },
  {
    id: 'k2',
    homeId: 'h2',
    title: 'Request DBS check for Taylor Brooks',
    assigneeId: 's4',
    dueDate: daysFromNow(-2),
    done: false,
  },
  {
    id: 'k3',
    homeId: 'h3',
    title: 'Monthly fire alarm test',
    assigneeId: 's8',
    dueDate: daysFromNow(10),
    done: true,
  },
]

export const units: Unit[] = [
  { id: 'u1', homeId: 'h1', name: 'Ground floor', capacity: 3 },
  { id: 'u2', homeId: 'h1', name: 'Annexe', capacity: 2 },
  { id: 'u3', homeId: 'h2', name: 'Main house', capacity: 4 },
  { id: 'u4', homeId: 'h3', name: 'Main house', capacity: 3 },
]

export const documents: DocumentRecord[] = [
  {
    id: 'd1',
    homeId: 'h1',
    ownerType: 'home',
    ownerId: 'h1',
    title: 'Safeguarding policy',
    category: 'Other',
    fileName: 'safeguarding-policy.pdf',
    uploadedAt: daysFromNow(-60),
  },
  {
    id: 'd2',
    homeId: 'h1',
    ownerType: 'home',
    ownerId: 'h1',
    title: 'Fire risk assessment',
    category: 'Fire risk assessment',
    fileName: 'fire-risk.pdf',
    uploadedAt: daysFromNow(-20),
  },
  {
    id: 'd3',
    homeId: 'h2',
    ownerType: 'home',
    ownerId: 'h2',
    title: 'Medication procedure',
    category: 'Other',
    fileName: 'medication.pdf',
    uploadedAt: daysFromNow(-90),
  },
]

export const auditLog: AuditEntry[] = [
  {
    id: 'a1',
    at: new Date(Date.now() - 86_400_000).toISOString(),
    actorName: 'Alex Morgan',
    action: 'Added interim measure',
    target: 'Safeguarding training — Jordan Lee',
    homeId: 'h1',
  },
]

export const appUsers: AppUser[] = [
  {
    id: 'u-admin',
    fullName: 'Demo Admin',
    email: 'admin@example.test',
    role: 'admin',
    homeIds: [],
    active: true,
  },
  {
    id: 's1',
    fullName: 'Alex Morgan',
    email: 'alex@example.test',
    role: 'registered_manager',
    homeIds: ['h1', 'h2'],
    active: true,
  },
  {
    id: 's2',
    fullName: 'Sam Taylor',
    email: 'sam@example.test',
    role: 'support_worker',
    homeIds: ['h1'],
    active: true,
  },
  {
    id: 's3',
    fullName: 'Jordan Lee',
    email: 'jordan@example.test',
    role: 'support_worker',
    homeIds: ['h1'],
    active: true,
  },
]

export const orgSettings: OrgSettings = {
  name: 'Demo Care Group',
  amberDays: 30,
}

export const audits: Audit[] = [
  {
    id: 'au1',
    homeId: 'h1',
    title: 'Medication audit',
    auditDate: daysFromNow(-14),
    requiredAction: 'Update MAR chart sign-off process',
    resolved: false,
    expiryDate: daysFromNow(16),
    feedbackFileName: 'medication-audit-feedback.pdf',
  },
  {
    id: 'au2',
    homeId: 'h2',
    title: 'Health & safety audit',
    auditDate: daysFromNow(-40),
    requiredAction: 'Replace two faulty smoke alarms',
    resolved: true,
    expiryDate: daysFromNow(-5),
  },
]

export const policies: Policy[] = [
  {
    id: 'p1',
    title: 'Safeguarding policy',
    lastReviewed: daysFromNow(-340),
    reviewDue: daysFromNow(25),
    fileName: 'safeguarding-policy.pdf',
    visibleToWorkers: true,
  },
  {
    id: 'p2',
    title: 'Behaviour support policy',
    lastReviewed: daysFromNow(-400),
    reviewDue: daysFromNow(-35),
    fileName: 'behaviour-support.pdf',
    visibleToWorkers: false,
  },
  {
    id: 'p3',
    title: 'Complaints procedure',
    lastReviewed: daysFromNow(-90),
    reviewDue: daysFromNow(275),
    fileName: 'complaints-procedure.pdf',
    visibleToWorkers: true,
  },
]
