import type {
  AppUser,
  Audit,
  Policy,
  AuditEntry,
  OrgSettings,
  Organisation,
  DocumentRecord,
  Home,
  InterimMeasure,
  QuickLog,
  StaffMember,
  Task,
  TrainingRecord,
  Unit,
  YoungPerson,
} from '@/types'

/** Demo tenant: all names are fictional. Dates are relative to today so RAG states stay demonstrable. */
export function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const homes: Home[] = [
  { id: 'h1', name: 'Oakview House', address: '12 Oak Lane, Demotown' },
  { id: 'h2', name: 'Riverside Lodge', address: '4 River Road, Demotown' },
  { id: 'h3', name: 'Maple Court', address: '9 Maple Court, Exampleton' },
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
  },
  {
    id: 's2',
    homeId: 'h1',
    fullName: 'Sam Taylor',
    jobTitle: 'Support Worker',
    address: '2 Sample St',
    dbsRecheckDate: daysFromNow(14),
    safeguardingExpiry: daysFromNow(90),
  },
  {
    id: 's3',
    homeId: 'h1',
    fullName: 'Jordan Lee',
    jobTitle: 'Support Worker',
    address: '3 Sample St',
    dbsRecheckDate: daysFromNow(300),
    safeguardingExpiry: daysFromNow(-5),
  },
  {
    id: 's4',
    homeId: 'h2',
    fullName: 'Casey Quinn',
    jobTitle: 'Registered Manager',
    address: '4 Sample St',
    dbsRecheckDate: daysFromNow(120),
    safeguardingExpiry: daysFromNow(60),
  },
  {
    id: 's5',
    homeId: 'h2',
    fullName: 'Riley Evans',
    jobTitle: 'Support Worker',
    address: '5 Sample St',
    dbsRecheckDate: daysFromNow(45),
    safeguardingExpiry: daysFromNow(20),
  },
  {
    id: 's6',
    homeId: 'h2',
    fullName: 'Taylor Brooks',
    jobTitle: 'Support Worker',
    address: '6 Sample St',
    dbsRecheckDate: null,
    safeguardingExpiry: daysFromNow(180),
  },
  {
    id: 's7',
    homeId: 'h3',
    fullName: 'Morgan Reid',
    jobTitle: 'Registered Manager',
    address: '7 Sample St',
    dbsRecheckDate: daysFromNow(250),
    safeguardingExpiry: daysFromNow(220),
  },
  {
    id: 's8',
    homeId: 'h3',
    fullName: 'Avery Stone',
    jobTitle: 'Support Worker',
    address: '8 Sample St',
    dbsRecheckDate: daysFromNow(400),
    safeguardingExpiry: daysFromNow(300),
  },
]

export const trainingRecords: TrainingRecord[] = [
  {
    id: 't1',
    staffId: 's2',
    course: 'First Aid',
    completedOn: daysFromNow(-350),
    expiresOn: daysFromNow(15),
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

export const interimMeasures: InterimMeasure[] = [
  {
    id: 'i1',
    itemKey: 'safeguarding:s3',
    note: 'Not to be left as sole carer on shift until refresher is completed. Booked for next week.',
    createdAt: daysFromNow(-4),
    active: true,
  },
]

export const youngPeople: YoungPerson[] = [
  {
    id: 'y1',
    homeId: 'h1',
    initials: 'A.B.',
    fullName: 'Demo Young Person One',
    dateOfBirth: '2010-04-02',
    restricted: false,
  },
  {
    id: 'y2',
    homeId: 'h1',
    initials: 'C.D.',
    fullName: 'Demo Young Person Two',
    dateOfBirth: '2009-09-18',
    restricted: true,
  },
  {
    id: 'y3',
    homeId: 'h2',
    initials: 'E.F.',
    fullName: 'Demo Young Person Three',
    dateOfBirth: '2011-01-30',
    restricted: false,
  },
]

export const quickLogs: QuickLog[] = [
  {
    id: 'q1',
    homeId: 'h1',
    youngPersonId: 'y1',
    authorId: 's2',
    createdAt: daysFromNow(-1),
    tags: ['Emotional Wellbeing'],
    note: 'Settled well after school; chose to join group activity.',
  },
  {
    id: 'q2',
    homeId: 'h2',
    youngPersonId: 'y3',
    authorId: 's5',
    createdAt: daysFromNow(-2),
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
    title: 'Safeguarding policy',
    category: 'Policy',
    fileName: 'safeguarding-policy.pdf',
    uploadedAt: daysFromNow(-60),
  },
  {
    id: 'd2',
    homeId: 'h1',
    title: 'Fire risk assessment',
    category: 'Compliance',
    fileName: 'fire-risk.pdf',
    uploadedAt: daysFromNow(-20),
  },
  {
    id: 'd3',
    homeId: 'h2',
    title: 'Medication procedure',
    category: 'Policy',
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

export const organisations: Organisation[] = [
  { id: 'demo-org', name: 'Demo Care Group', createdAt: daysFromNow(-120) },
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
  },
  {
    id: 'au2',
    homeId: 'h2',
    title: 'Health & safety audit',
    auditDate: daysFromNow(-40),
    requiredAction: 'Replace two faulty smoke alarms',
    resolved: true,
  },
]

export const policies: Policy[] = [
  {
    id: 'p1',
    title: 'Safeguarding policy',
    lastReviewed: daysFromNow(-340),
    reviewDue: daysFromNow(25),
  },
  {
    id: 'p2',
    title: 'Behaviour support policy',
    lastReviewed: daysFromNow(-400),
    reviewDue: daysFromNow(-35),
  },
  {
    id: 'p3',
    title: 'Complaints procedure',
    lastReviewed: daysFromNow(-90),
    reviewDue: daysFromNow(275),
  },
]
