import type {
  AppUser,
  Audit,
  Policy,
  AuditEntry,
  OrgSettings,
  QualityStandardGroupId,
  DocumentOwner,
  DocumentRecord,
  Home,
  HomeFieldConfig,
  HomeInput,
  InterimMeasure,
  Profile,
  QuickLog,
  StaffMember,
  Task,
  TrainingCourse,
  TrainingRecord,
  Unit,
  YoungPerson,
} from '@/types'
import {
  cleanCustomValues,
  validateFieldConfig,
} from '@/features/homes/customFields'
import { isQsGroupId } from '@/features/young-people/qualityStandards'
import * as mock from './mock'

/**
 * Data access boundary. Currently backed by in-memory mock data; each function
 * becomes a Supabase query later, with the same signature.
 * Scoping and write checks mirror what RLS will enforce: other roles only see
 * their assigned homes, and support workers are read-only.
 */
const delay = <T>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 80))

const canSee = (profile: Profile, homeId: string) =>
  profile.role === 'responsible_individual' || profile.homeIds.includes(homeId)

function assertCanWrite(profile: Profile, homeId?: string) {
  if (profile.role === 'support_worker') throw new Error('Not permitted')
  if (homeId && !canSee(profile, homeId))
    throw new Error('Not permitted for this home')
}

const newId = () => crypto.randomUUID()

/** Validation lives here so the same rules apply whichever backend sits behind these functions. */
function requireText(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required`)
}

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/** Every write appends here. There is deliberately no function to edit or remove entries. */
function audit(
  profile: Profile,
  action: string,
  target: string,
  homeId?: string,
) {
  mock.auditLog.unshift({
    id: newId(),
    at: new Date().toISOString(),
    actorName: profile.fullName,
    action,
    target,
    homeId,
  })
}

export const listHomes = (profile: Profile): Promise<Home[]> =>
  delay(mock.homes.filter((h) => canSee(profile, h.id)))

export const listUnits = (profile: Profile): Promise<Unit[]> =>
  delay(mock.units.filter((u) => canSee(profile, u.homeId)))

export const listStaff = (profile: Profile): Promise<StaffMember[]> =>
  delay(mock.staff.filter((s) => !s.archived && canSee(profile, s.homeId)))

export const listTrainingRecords = (
  profile: Profile,
): Promise<TrainingRecord[]> => {
  const staffIds = new Set(
    mock.staff
      .filter((s) => !s.archived && canSee(profile, s.homeId))
      .map((s) => s.id),
  )
  return delay(mock.trainingRecords.filter((t) => staffIds.has(t.staffId)))
}

export const listInterimMeasures = (): Promise<InterimMeasure[]> =>
  delay([...mock.interimMeasures])

function validateHome(input: HomeInput) {
  requireText(input.name, 'Home name')
  requireText(input.address, 'Address')
  requireText(input.ofstedUrn, 'Ofsted URN')
  if (!Number.isInteger(input.approvedCapacity) || input.approvedCapacity < 1)
    throw new Error('Approved capacity must be a whole number of at least 1')
}

export async function addHome(profile: Profile, input: HomeInput) {
  validateHome(input)
  if (mock.homes.some((h) => sameName(h.name, input.name)))
    throw new Error('A home with this name already exists')
  if (profile.role !== 'responsible_individual')
    throw new Error('Only Responsible Individuals can create homes')
  mock.homes.push({
    id: newId(),
    ...input,
    customFields: cleanCustomValues(
      mock.orgSettings.homeFields,
      input.customFields,
      undefined,
    ),
  })
  audit(profile, 'Added home', input.name)
  return delay(true)
}

export async function addUnit(profile: Profile, input: Omit<Unit, 'id'>) {
  requireText(input.name, 'Unit name')
  if (!Number.isInteger(input.capacity) || input.capacity < 1)
    throw new Error('Capacity must be a whole number of at least 1')
  assertCanWrite(profile, input.homeId)
  mock.units.push({ id: newId(), ...input })
  audit(profile, 'Added unit', input.name, input.homeId)
  return delay(true)
}

export async function saveStaff(
  profile: Profile,
  input: Omit<StaffMember, 'id'> & { id?: string },
) {
  requireText(input.fullName, 'Full name')
  requireText(input.jobTitle, 'Job title')
  assertCanWrite(profile, input.homeId)
  const existing = input.id
    ? mock.staff.findIndex((s) => s.id === input.id)
    : -1
  if (existing >= 0) mock.staff[existing] = { ...input, id: input.id! }
  else mock.staff.push({ ...input, id: newId() })
  audit(
    profile,
    existing >= 0 ? 'Updated staff member' : 'Added staff member',
    input.fullName,
    input.homeId,
  )
  return delay(true)
}

export const listTrainingCourses = (): Promise<TrainingCourse[]> =>
  delay([...mock.trainingCourses])

export async function addTrainingCourse(
  profile: Profile,
  input: { name: string },
) {
  requireText(input.name, 'Training name')
  assertCanWrite(profile)
  const name = input.name.trim()
  if (
    sameName(name, 'Safeguarding') ||
    mock.trainingCourses.some((c) => sameName(c.name, name))
  )
    throw new Error('This training already exists')
  mock.trainingCourses.push({ id: newId(), name })
  audit(profile, 'Added training type', name)
  return delay(true)
}

export async function addTrainingRecord(
  profile: Profile,
  input: Omit<TrainingRecord, 'id'>,
) {
  requireText(input.course, 'Course')
  if (input.expiresOn && input.expiresOn < input.completedOn)
    throw new Error('Expiry date must be on or after the completion date')
  const member = mock.staff.find((s) => s.id === input.staffId)
  assertCanWrite(profile, member?.homeId)
  mock.trainingRecords.push({ id: newId(), ...input })
  audit(
    profile,
    'Added training record',
    `${input.course} — ${member?.fullName}`,
    member?.homeId,
  )
  return delay(true)
}

const ITEM_LABELS: Record<string, string> = {
  dbs: 'DBS recheck',
  safeguarding: 'Safeguarding training',
}

/** Turns a compliance item key (e.g. `dbs:s6`) into a readable label and its home. */
function describeItem(key: string): { target: string; homeId: string } | null {
  const [kind, id, fieldId] = key.split(':')
  if (kind === 'homefield') {
    const home = mock.homes.find((h) => h.id === id)
    const field = mock.orgSettings.homeFields.fields.find(
      (f) => f.id === fieldId && !f.archived && f.trackExpiry,
    )
    return home && field
      ? { target: `${field.label} — ${home.name}`, homeId: home.id }
      : null
  }
  if (kind === 'audit') {
    const found = mock.audits.find((a) => a.id === id)
    return found
      ? { target: `${found.title} audit`, homeId: found.homeId }
      : null
  }
  if (kind === 'policy') {
    const policy = mock.policies.find((p) => p.id === id)
    return policy ? { target: `${policy.title} policy`, homeId: '' } : null
  }
  const record =
    kind === 'training'
      ? mock.trainingRecords.find((t) => t.id === id)
      : undefined
  const member = mock.staff.find(
    (st) => st.id === (record ? record.staffId : id),
  )
  if (!member) return null
  const label = record ? record.course : ITEM_LABELS[kind]
  return label
    ? { target: `${label} — ${member.fullName}`, homeId: member.homeId }
    : null
}

export async function addInterimMeasure(
  profile: Profile,
  input: { itemKey: string; note: string },
) {
  const item = describeItem(input.itemKey)
  if (!item) throw new Error('Compliance item not found')
  assertCanWrite(profile, item.homeId)
  if (!input.note.trim()) throw new Error('A note is required')
  mock.interimMeasures.push({
    id: newId(),
    ...input,
    note: input.note.trim(),
    createdAt: mock.daysFromNow(0),
    active: true,
  })
  audit(profile, 'Added interim measure', item.target, item.homeId)
  return delay(true)
}

export const listYoungPeople = (profile: Profile): Promise<YoungPerson[]> =>
  delay(
    mock.youngPeople.filter(
      (y) =>
        !y.archived &&
        canSee(profile, y.homeId) &&
        !(profile.role === 'support_worker' && y.restricted),
    ),
  )

export async function saveYoungPerson(
  profile: Profile,
  input: Omit<YoungPerson, 'id' | 'initials'> & { id?: string },
) {
  requireText(input.fullName, 'Full name')
  if (input.dateOfBirth > mock.daysFromNow(0))
    throw new Error('Date of birth cannot be in the future')
  if (input.moveInDate && input.moveInDate > mock.daysFromNow(0))
    throw new Error('Move-in date cannot be in the future')
  if (input.moveInDate && input.moveInDate < input.dateOfBirth)
    throw new Error('Move-in date cannot be before the date of birth')
  if (
    input.unitId &&
    !mock.units.some((u) => u.id === input.unitId && u.homeId === input.homeId)
  )
    throw new Error('Choose a unit in the selected home')
  assertCanWrite(profile, input.homeId)
  const initials = input.fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w[0].toUpperCase()}.`)
    .join('')
  const idx = input.id
    ? mock.youngPeople.findIndex((y) => y.id === input.id)
    : -1
  if (idx >= 0) mock.youngPeople[idx] = { ...input, id: input.id!, initials }
  else mock.youngPeople.push({ ...input, id: newId(), initials })
  audit(
    profile,
    idx >= 0 ? 'Updated young person record' : 'Added young person record',
    initials,
    input.homeId,
  )
  return delay(true)
}

export async function listQuickLogs(profile: Profile): Promise<QuickLog[]> {
  const visible = new Set((await listYoungPeople(profile)).map((y) => y.id))
  return delay(
    mock.quickLogs
      .filter((l) => canSee(profile, l.homeId) && visible.has(l.youngPersonId))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  )
}

export async function addQuickLog(
  profile: Profile,
  input: Pick<
    QuickLog,
    'youngPersonId' | 'tags' | 'note' | 'occurredAt' | 'ratings'
  >,
) {
  const yp = (await listYoungPeople(profile)).find(
    (y) => y.id === input.youngPersonId,
  )
  if (!yp) throw new Error('Not permitted for this young person')
  if (!input.note.trim()) throw new Error('A note is required')
  mock.quickLogs.push({
    id: newId(),
    homeId: yp.homeId,
    authorId: profile.id,
    createdAt: new Date().toISOString(),
    ...input,
    note: input.note.trim(),
  })
  audit(profile, 'Added quick log', yp.initials, yp.homeId)
  return delay(true)
}

export const listTasks = (profile: Profile): Promise<Task[]> =>
  delay(
    mock.tasks
      .filter(
        (t) =>
          canSee(profile, t.homeId) &&
          (profile.role !== 'support_worker' || t.assigneeId === profile.id),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  )

export async function addTask(
  profile: Profile,
  input: Omit<Task, 'id' | 'done'>,
) {
  requireText(input.title, 'Title')
  assertCanWrite(profile, input.homeId)
  mock.tasks.push({ id: newId(), done: false, ...input })
  audit(profile, 'Created task', input.title, input.homeId)
  return delay(true)
}

export async function setTaskDone(
  profile: Profile,
  input: { id: string; done: boolean },
) {
  const task = mock.tasks.find((t) => t.id === input.id)
  if (!task || !canSee(profile, task.homeId)) throw new Error('Not permitted')
  if (profile.role === 'support_worker' && task.assigneeId !== profile.id)
    throw new Error('Not permitted')
  task.done = input.done
  audit(
    profile,
    input.done ? 'Completed task' : 'Reopened task',
    task.title,
    task.homeId,
  )
  return delay(true)
}

export async function listDocuments(
  profile: Profile,
): Promise<DocumentRecord[]> {
  // Support workers only ever see young people's documents, and only for young
  // people they can open (assigned home, not restricted).
  const visibleYoungPeople =
    profile.role === 'support_worker'
      ? new Set((await listYoungPeople(profile)).map((y) => y.id))
      : null
  return delay(
    mock.documents.filter(
      (d) =>
        canSee(profile, d.homeId) &&
        (!visibleYoungPeople ||
          (d.ownerType === 'young_person' &&
            visibleYoungPeople.has(d.ownerId))),
    ),
  )
}

export async function addDocument(
  profile: Profile,
  input: Omit<DocumentRecord, 'id' | 'uploadedAt'>,
) {
  requireText(input.title, 'Title')
  if (profile.role === 'support_worker') {
    // Support workers may upload to a young person's file they can open, nothing else.
    const yp = (await listYoungPeople(profile)).find(
      (y) => y.id === input.ownerId,
    )
    if (input.ownerType !== 'young_person' || !yp || yp.homeId !== input.homeId)
      throw new Error('Not permitted')
  } else assertCanWrite(profile, input.homeId)
  mock.documents.push({
    id: newId(),
    uploadedAt: mock.daysFromNow(0),
    ...input,
  })
  audit(profile, 'Uploaded document', input.title, input.homeId)
  return delay(true)
}

export function listAuditLog(profile: Profile): Promise<AuditEntry[]> {
  if (profile.role === 'support_worker') throw new Error('Not permitted')
  return delay(
    mock.auditLog.filter((e) => !e.homeId || canSee(profile, e.homeId)),
  )
}

function assertResponsibleIndividual(profile: Profile) {
  if (profile.role !== 'responsible_individual')
    throw new Error('Responsible Individuals only')
}

export function listUsers(profile: Profile): Promise<AppUser[]> {
  assertResponsibleIndividual(profile)
  return delay([...mock.appUsers])
}

export async function saveUser(
  profile: Profile,
  input: Omit<AppUser, 'id' | 'active'> & { id?: string },
) {
  requireText(input.fullName, 'Full name')
  if (!/^\S+@\S+\.\S+$/.test(input.email))
    throw new Error('Enter a valid email address')
  if (
    mock.appUsers.some(
      (u) => u.id !== input.id && sameName(u.email, input.email),
    )
  )
    throw new Error('A user with this email already exists')
  if (input.role !== 'responsible_individual' && input.homeIds.length === 0)
    throw new Error('Select at least one home for this user')
  assertResponsibleIndividual(profile)
  const idx = input.id ? mock.appUsers.findIndex((u) => u.id === input.id) : -1
  const homeIds = input.role === 'responsible_individual' ? [] : input.homeIds
  if (idx >= 0)
    mock.appUsers[idx] = {
      ...mock.appUsers[idx],
      ...input,
      homeIds,
      id: input.id!,
    }
  else mock.appUsers.push({ ...input, homeIds, id: newId(), active: true })
  audit(profile, idx >= 0 ? 'Updated user' : 'Invited user', input.fullName)
  return delay(true)
}

export async function setUserActive(
  profile: Profile,
  input: { id: string; active: boolean },
) {
  assertResponsibleIndividual(profile)
  const user = mock.appUsers.find((u) => u.id === input.id)
  if (!user) throw new Error('User not found')
  if (user.id === profile.id) throw new Error('You cannot deactivate yourself')
  user.active = input.active
  audit(
    profile,
    input.active ? 'Reactivated user' : 'Deactivated user',
    user.fullName,
  )
  return delay(true)
}

export const getSettings = (): Promise<OrgSettings> =>
  delay(structuredClone(mock.orgSettings))

export async function saveSettings(
  profile: Profile,
  input: Pick<OrgSettings, 'name' | 'amberDays'>,
) {
  assertResponsibleIndividual(profile)
  if (
    !Number.isInteger(input.amberDays) ||
    input.amberDays < 1 ||
    input.amberDays > 365
  )
    throw new Error('Invalid amber window')
  Object.assign(mock.orgSettings, input)
  audit(profile, 'Updated settings', input.name)
  return delay(true)
}

/**
 * Replaces the company's extra home fields and the sections that group them. Fields can
 * be retired but not deleted, and their type is fixed, so saved values never go stale.
 */
export async function saveHomeFields(profile: Profile, input: HomeFieldConfig) {
  assertResponsibleIndividual(profile)
  mock.orgSettings.homeFields = validateFieldConfig(
    input,
    mock.orgSettings.homeFields,
  )
  audit(profile, 'Updated home fields', 'Homes')
  return delay(true)
}

const OWNER_LABEL: Record<DocumentOwner, string> = {
  home: 'home documents',
  staff: 'staff files',
  young_person: "young people's files",
}
const MAX_CATEGORY_LENGTH = 60

/**
 * Replaces the company's document categories for one kind of file. `was` carries the
 * previous name of a renamed category so documents already filed under it follow the
 * rename. Removing a category never deletes documents; they keep their label.
 */
export async function saveDocumentCategories(
  profile: Profile,
  input: {
    ownerType: DocumentOwner
    /** Young people only: the Quality Standard group each category is shown under. */
    categories: {
      name: string
      was?: string
      group?: QualityStandardGroupId | null
    }[]
  },
) {
  assertResponsibleIndividual(profile)
  const categories = input.categories.map((c) => ({
    ...c,
    name: c.name.trim().replace(/\s+/g, ' '),
  }))
  if (categories.length === 0) throw new Error('Keep at least one category')
  for (const [i, c] of categories.entries()) {
    requireText(c.name, 'Category name')
    if (c.name.length > MAX_CATEGORY_LENGTH)
      throw new Error(
        `Category names can be at most ${MAX_CATEGORY_LENGTH} characters`,
      )
    if (categories.findIndex((o) => sameName(o.name, c.name)) !== i)
      throw new Error(`"${c.name}" is used more than once`)
  }
  const current = mock.orgSettings.documentCategories[input.ownerType]
  const renames = categories.filter(
    (c) => c.was !== undefined && c.was !== c.name && current.includes(c.was),
  )
  for (const d of mock.documents)
    if (d.ownerType === input.ownerType) {
      const rename = renames.find((r) => r.was === d.category)
      if (rename) d.category = rename.name
    }
  mock.orgSettings.documentCategories[input.ownerType] = categories.map(
    (c) => c.name,
  )
  if (input.ownerType === 'young_person') {
    // Groups follow renames; removed categories keep their group so their
    // documents still land in the right place in the inspection pack.
    const previous = mock.orgSettings.youngPersonCategoryGroups
    const carried = new Set(categories.map((c) => c.was ?? c.name))
    const groups: Record<string, QualityStandardGroupId> = Object.fromEntries(
      Object.entries(previous).filter(([name]) => !carried.has(name)),
    )
    for (const c of categories) {
      const group = c.group === undefined ? previous[c.was ?? c.name] : c.group
      if (isQsGroupId(group)) groups[c.name] = group
    }
    mock.orgSettings.youngPersonCategoryGroups = groups
  }
  audit(profile, 'Updated document categories', OWNER_LABEL[input.ownerType])
  return delay(true)
}

export const listAudits = (profile: Profile): Promise<Audit[]> =>
  delay(
    mock.audits
      .filter(() => profile.role === 'responsible_individual')
      .sort((a, b) => b.auditDate.localeCompare(a.auditDate)),
  )

export async function addAudit(
  profile: Profile,
  input: Pick<
    Audit,
    | 'homeId'
    | 'title'
    | 'auditDate'
    | 'requiredAction'
    | 'expiryDate'
    | 'feedbackFileName'
  >,
) {
  requireText(input.title, 'Audit title')
  if (input.expiryDate && input.expiryDate < input.auditDate)
    throw new Error('Next due date must be on or after the audit date')
  assertResponsibleIndividual(profile)
  mock.audits.push({
    id: newId(),
    resolved: input.requiredAction.trim() === '',
    ...input,
  })
  audit(profile, 'Recorded audit', input.title, input.homeId)
  return delay(true)
}

export async function setAuditResolved(
  profile: Profile,
  input: { id: string; resolved: boolean },
) {
  const found = mock.audits.find((a) => a.id === input.id)
  if (!found) throw new Error('Audit not found')
  assertResponsibleIndividual(profile)
  found.resolved = input.resolved
  audit(
    profile,
    input.resolved ? 'Resolved audit action' : 'Reopened audit action',
    found.title,
    found.homeId,
  )
  return delay(true)
}

export const listPolicies = (profile: Profile): Promise<Policy[]> =>
  delay(
    mock.policies.filter(
      (p) => profile.role !== 'support_worker' || p.visibleToWorkers,
    ),
  )

export async function addPolicy(
  profile: Profile,
  input: Pick<
    Policy,
    'title' | 'lastReviewed' | 'reviewDue' | 'fileName' | 'visibleToWorkers'
  >,
) {
  requireText(input.title, 'Policy title')
  requireText(input.reviewDue, 'Expiry date')
  requireText(input.lastReviewed, 'Date completed')
  if (input.reviewDue < input.lastReviewed)
    throw new Error('Expiry date must be on or after the date completed')
  assertCanWrite(profile)
  mock.policies.push({ id: newId(), ...input })
  audit(profile, 'Added policy', input.title)
  return delay(true)
}

export async function setPolicyVisibility(
  profile: Profile,
  input: { id: string; visibleToWorkers: boolean },
) {
  assertCanWrite(profile)
  const found = mock.policies.find((p) => p.id === input.id)
  if (!found) throw new Error('Policy not found')
  found.visibleToWorkers = input.visibleToWorkers
  audit(
    profile,
    input.visibleToWorkers
      ? 'Shared policy with support workers'
      : 'Hid policy from support workers',
    found.title,
  )
  return delay(true)
}

/** Records a review today and schedules the next one a year out. */
export async function markPolicyReviewed(
  profile: Profile,
  input: { id: string },
) {
  assertCanWrite(profile)
  const found = mock.policies.find((p) => p.id === input.id)
  if (!found) throw new Error('Policy not found')
  found.lastReviewed = mock.daysFromNow(0)
  found.reviewDue = mock.daysFromNow(365)
  audit(profile, 'Reviewed policy', found.title)
  return delay(true)
}

export async function updateTask(
  profile: Profile,
  input: Pick<Task, 'id' | 'title' | 'assigneeId' | 'dueDate'>,
) {
  requireText(input.title, 'Title')
  const task = mock.tasks.find((t) => t.id === input.id)
  if (!task) throw new Error('Task not found')
  assertCanWrite(profile, task.homeId)
  Object.assign(task, {
    title: input.title,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
  })
  audit(profile, 'Updated task', task.title, task.homeId)
  return delay(true)
}

export async function deleteTask(profile: Profile, input: { id: string }) {
  const idx = mock.tasks.findIndex((t) => t.id === input.id)
  if (idx < 0) throw new Error('Task not found')
  const task = mock.tasks[idx]
  assertCanWrite(profile, task.homeId)
  mock.tasks.splice(idx, 1)
  audit(profile, 'Deleted task', task.title, task.homeId)
  return delay(true)
}

/** Authors may correct their own logs; managers and Responsible Individuals may correct any log they can see. */
export async function updateQuickLog(
  profile: Profile,
  input: Pick<QuickLog, 'id' | 'tags' | 'note'> &
    Partial<Pick<QuickLog, 'occurredAt' | 'ratings'>>,
) {
  const log = mock.quickLogs.find((l) => l.id === input.id)
  if (!log || !canSee(profile, log.homeId)) throw new Error('Not permitted')
  if (profile.role === 'support_worker' && log.authorId !== profile.id)
    throw new Error('You can only edit your own logs')
  if (!input.note.trim()) throw new Error('A note is required')
  Object.assign(log, {
    tags: input.tags,
    note: input.note.trim(),
    ...(input.occurredAt && { occurredAt: input.occurredAt }),
    ...(input.ratings && { ratings: input.ratings }),
  })
  audit(profile, 'Edited quick log', log.youngPersonId, log.homeId)
  return delay(true)
}

export async function updateHome(
  profile: Profile,
  input: HomeInput & { id: string },
) {
  validateHome(input)
  if (mock.homes.some((h) => h.id !== input.id && sameName(h.name, input.name)))
    throw new Error('A home with this name already exists')
  if (profile.role !== 'responsible_individual')
    throw new Error('Only Responsible Individuals can edit homes')
  const home = mock.homes.find((h) => h.id === input.id)
  if (!home) throw new Error('Home not found')
  Object.assign(home, {
    ...input,
    customFields: cleanCustomValues(
      mock.orgSettings.homeFields,
      input.customFields,
      home.customFields,
    ),
  })
  audit(profile, 'Updated home', input.name, home.id)
  return delay(true)
}

export async function deleteUnit(profile: Profile, input: { id: string }) {
  const idx = mock.units.findIndex((u) => u.id === input.id)
  if (idx < 0) throw new Error('Unit not found')
  const unit = mock.units[idx]
  assertCanWrite(profile, unit.homeId)
  mock.units.splice(idx, 1)
  audit(profile, 'Deleted unit', unit.name, unit.homeId)
  return delay(true)
}

export async function archiveStaff(profile: Profile, input: { id: string }) {
  const member = mock.staff.find((s) => s.id === input.id)
  if (!member) throw new Error('Staff member not found')
  assertCanWrite(profile, member.homeId)
  member.archived = true
  audit(profile, 'Archived staff member', member.fullName, member.homeId)
  return delay(true)
}

export async function archiveYoungPerson(
  profile: Profile,
  input: { id: string },
) {
  const yp = mock.youngPeople.find((y) => y.id === input.id)
  if (!yp) throw new Error('Record not found')
  assertCanWrite(profile, yp.homeId)
  yp.archived = true
  audit(profile, 'Archived young person record', yp.initials, yp.homeId)
  return delay(true)
}

export async function deleteDocument(profile: Profile, input: { id: string }) {
  const idx = mock.documents.findIndex((d) => d.id === input.id)
  if (idx < 0) throw new Error('Document not found')
  const doc = mock.documents[idx]
  assertCanWrite(profile, doc.homeId)
  mock.documents.splice(idx, 1)
  audit(profile, 'Deleted document', doc.title, doc.homeId)
  return delay(true)
}
