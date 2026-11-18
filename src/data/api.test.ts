import { demoUsers } from './demoUsers'
import * as api from './api'
import { profile } from './mock'
import type { HomeInput } from '@/types'

const [responsibleIndividual, manager, worker] = demoUsers

const homeInput = (over: Partial<HomeInput> = {}): HomeInput => ({
  name: 'New Home',
  address: '1 Test Street',
  ofstedUrn: 'SC999999',
  approvedCapacity: 3,
  phone: '',
  outOfHoursPhone: '',
  managerName: '',
  managerEmail: '',
  managerPhone: '',
  laContact: '',
  ageRange: '',
  genderPermitted: '',
  ...over,
})

describe('write permissions', () => {
  it('blocks support workers from deleting tasks, documents and archiving staff', async () => {
    await expect(api.deleteTask(worker, { id: 'k1' })).rejects.toThrow(
      'Not permitted',
    )
    await expect(api.deleteDocument(worker, { id: 'd1' })).rejects.toThrow(
      'Not permitted',
    )
    await expect(api.archiveStaff(worker, { id: 's3' })).rejects.toThrow(
      'Not permitted',
    )
  })
  it('stops managers writing to homes they are not assigned to', async () => {
    await expect(api.deleteUnit(manager, { id: 'u4' })).rejects.toThrow(
      'Not permitted for this home',
    )
  })
  it('only lets Responsible Individuals edit homes', async () => {
    await expect(
      api.updateHome(manager, { id: 'h1', ...homeInput() }),
    ).rejects.toThrow('Only Responsible Individuals')
  })
})

describe('quick log editing', () => {
  it('lets a worker edit their own log but not someone else’s', async () => {
    await expect(
      api.updateQuickLog(worker, {
        id: 'q1',
        tags: ['Health'],
        note: 'Updated',
      }),
    ).resolves.toBe(true)
    await expect(
      api.updateQuickLog(worker, { id: 'q2', tags: [], note: 'nope' }),
    ).rejects.toThrow()
  })
  it('requires a note', async () => {
    await expect(
      api.updateQuickLog(manager, { id: 'q1', tags: [], note: '   ' }),
    ).rejects.toThrow('note is required')
  })
})

describe('home profile', () => {
  it('requires an Ofsted URN and a positive capacity', async () => {
    await expect(
      api.addHome(responsibleIndividual, homeInput({ ofstedUrn: ' ' })),
    ).rejects.toThrow('Ofsted URN is required')
    await expect(
      api.addHome(responsibleIndividual, homeInput({ approvedCapacity: 0 })),
    ).rejects.toThrow('Approved capacity')
  })
  it('saves the full profile', async () => {
    await api.updateHome(responsibleIndividual, {
      id: 'h3',
      ...homeInput({
        name: 'Maple Court',
        ofstedUrn: 'SC555555',
        ageRange: '14-17',
      }),
    })
    const h = (await api.listHomes(responsibleIndividual)).find(
      (x) => x.id === 'h3',
    )
    expect(h?.ofstedUrn).toBe('SC555555')
    expect(h?.ageRange).toBe('14-17')
  })
})

describe('audits and policies', () => {
  it('limits audits to Responsible Individuals', async () => {
    expect(await api.listAudits(manager)).toEqual([])
    expect(
      (await api.listAudits(responsibleIndividual)).length,
    ).toBeGreaterThan(0)
    await expect(
      api.addAudit(manager, {
        homeId: 'h1',
        title: 'X',
        auditDate: '2026-01-01',
        requiredAction: '',
        expiryDate: null,
      }),
    ).rejects.toThrow('Responsible Individuals only')
  })
  it('rejects a next-due date before the audit date and stores feedback', async () => {
    const base = {
      homeId: 'h1',
      title: 'Fridge check',
      auditDate: '2026-02-01',
      requiredAction: '',
    }
    await expect(
      api.addAudit(responsibleIndividual, {
        ...base,
        expiryDate: '2026-01-01',
      }),
    ).rejects.toThrow('Next due date')
    await api.addAudit(responsibleIndividual, {
      ...base,
      expiryDate: '2026-02-08',
      feedbackFileName: 'fridge.pdf',
    })
    const saved = (await api.listAudits(responsibleIndividual)).find(
      (a) => a.title === 'Fridge check',
    )
    expect(saved?.expiryDate).toBe('2026-02-08')
    expect(saved?.feedbackFileName).toBe('fridge.pdf')
  })
  it('hides unshared policies from support workers', async () => {
    const all = await api.listPolicies(manager)
    const visible = await api.listPolicies(worker)
    expect(visible.length).toBeLessThan(all.length)
    expect(visible.every((p) => p.visibleToWorkers)).toBe(true)
  })
  it('lets a manager share a policy with workers', async () => {
    await api.setPolicyVisibility(manager, { id: 'p2', visibleToWorkers: true })
    expect((await api.listPolicies(worker)).some((p) => p.id === 'p2')).toBe(
      true,
    )
    await expect(
      api.setPolicyVisibility(worker, { id: 'p2', visibleToWorkers: false }),
    ).rejects.toThrow('Not permitted')
  })
})

describe('training courses', () => {
  it('lets a manager add a training and blocks duplicates', async () => {
    await api.addTrainingCourse(manager, { name: 'Manual Handling' })
    expect((await api.listTrainingCourses()).map((c) => c.name)).toContain(
      'Manual Handling',
    )
    await expect(
      api.addTrainingCourse(manager, { name: 'manual handling' }),
    ).rejects.toThrow('already exists')
    await expect(
      api.addTrainingCourse(worker, { name: 'Anything' }),
    ).rejects.toThrow('Not permitted')
  })
})

describe('adding a policy', () => {
  const base = {
    title: 'Data protection',
    lastReviewed: '2026-03-01',
    reviewDue: '2027-03-01',
    visibleToWorkers: false,
  }
  it('stores the date completed and rejects an earlier expiry', async () => {
    await api.addPolicy(manager, base)
    const saved = (await api.listPolicies(manager)).find(
      (p) => p.title === 'Data protection',
    )
    expect(saved?.lastReviewed).toBe('2026-03-01')
    await expect(
      api.addPolicy(manager, { ...base, reviewDue: '2026-02-01' }),
    ).rejects.toThrow('on or after')
  })
})

describe('archive and delete', () => {
  it('archived staff disappear from lists and the change is audited', async () => {
    await api.archiveStaff(manager, { id: 's3' })
    expect(
      (await api.listStaff(responsibleIndividual)).some((s) => s.id === 's3'),
    ).toBe(false)
    expect((await api.listAuditLog(responsibleIndividual))[0].action).toBe(
      'Archived staff member',
    )
  })
  it('deleting a task removes it and audits the deletion', async () => {
    await api.deleteTask(manager, { id: 'k1' })
    expect((await api.listTasks(manager)).some((t) => t.id === 'k1')).toBe(
      false,
    )
    expect((await api.listAuditLog(manager))[0].action).toBe('Deleted task')
  })
})

describe('interim measures', () => {
  it('audits a readable target and home instead of the internal key', async () => {
    await api.addInterimMeasure(manager, {
      itemKey: 'dbs:s6',
      note: 'Supervised on all shifts.',
    })
    const entry = (await api.listAuditLog(manager))[0]
    expect(entry.target).toBe('DBS recheck — Taylor Brooks')
    expect(entry.homeId).toBe('h2')
  })
  it('rejects items in homes the manager cannot access', async () => {
    await expect(
      api.addInterimMeasure(manager, { itemKey: 'dbs:s7', note: 'x' }),
    ).rejects.toThrow('Not permitted for this home')
  })
  it('rejects unknown items', async () => {
    await expect(
      api.addInterimMeasure(manager, { itemKey: 'dbs:nope', note: 'x' }),
    ).rejects.toThrow('not found')
  })
})

describe('validation', () => {
  it('rejects whitespace-only names and titles', async () => {
    await expect(
      api.addTask(manager, {
        homeId: 'h1',
        title: '   ',
        assigneeId: 's1',
        dueDate: '2026-12-01',
      }),
    ).rejects.toThrow('Title is required')
    await expect(
      api.addHome(responsibleIndividual, homeInput({ name: ' ' })),
    ).rejects.toThrow('Home name is required')
  })
  it('rejects duplicate home names and user emails', async () => {
    await expect(
      api.addHome(responsibleIndividual, homeInput({ name: 'oakview house' })),
    ).rejects.toThrow('already exists')
    await expect(
      api.saveUser(responsibleIndividual, {
        fullName: 'Dup',
        email: 'SAM@example.test',
        role: 'support_worker',
        homeIds: ['h1'],
      }),
    ).rejects.toThrow('already exists')
  })
  it('validates user email and home assignment', async () => {
    await expect(
      api.saveUser(responsibleIndividual, {
        fullName: 'A',
        email: 'nope',
        role: 'responsible_individual',
        homeIds: [],
      }),
    ).rejects.toThrow('valid email')
    await expect(
      api.saveUser(responsibleIndividual, {
        fullName: 'A',
        email: 'a@b.test',
        role: 'support_worker',
        homeIds: [],
      }),
    ).rejects.toThrow('at least one home')
  })
  it('rejects training that expires before it was completed', async () => {
    await expect(
      api.addTrainingRecord(manager, {
        staffId: 's2',
        course: 'CPR',
        completedOn: '2026-05-01',
        expiresOn: '2026-04-01',
      }),
    ).rejects.toThrow('Expiry date')
  })
  it('rejects bad unit capacity and future birth dates', async () => {
    await expect(
      api.addUnit(manager, { homeId: 'h1', name: 'Wing', capacity: 0 }),
    ).rejects.toThrow('at least 1')
    await expect(
      api.saveYoungPerson(manager, {
        homeId: 'h1',
        fullName: 'Test Person',
        dateOfBirth: '2999-01-01',
        restricted: false,
        ...profile(),
      }),
    ).rejects.toThrow('future')
  })
})

describe('young people oversight', () => {
  it('shows every young person, restricted files included, to the Responsible Individual', async () => {
    const ri = await api.listYoungPeople(responsibleIndividual)
    const restricted = ri.find((y) => y.restricted)
    expect(restricted).toBeDefined()
    expect(new Set(ri.map((y) => y.homeId)).size).toBeGreaterThan(1)
    const workerIds = (await api.listYoungPeople(worker)).map((y) => y.id)
    expect(workerIds).not.toContain(restricted!.id)
  })
})

describe('support worker document uploads', () => {
  const doc = (over: Record<string, unknown> = {}) => ({
    homeId: 'h1',
    ownerType: 'young_person' as const,
    ownerId: 'y1',
    title: 'Letter from school',
    category: 'Letters',
    fileName: 'letter.pdf',
    ...over,
  })

  it("lets a support worker upload to a young person's file they can open", async () => {
    await api.addDocument(worker, doc())
    const docs = await api.listDocuments(worker)
    expect(docs.some((d) => d.title === 'Letter from school')).toBe(true)
    expect((await api.listAuditLog(manager))[0].action).toBe(
      'Uploaded document',
    )
  })
  it('blocks uploads to home or staff files, other homes and restricted young people', async () => {
    const notPermitted = 'Not permitted'
    await expect(
      api.addDocument(worker, doc({ ownerType: 'home', ownerId: 'h1' })),
    ).rejects.toThrow(notPermitted)
    await expect(
      api.addDocument(worker, doc({ ownerType: 'staff', ownerId: 's1' })),
    ).rejects.toThrow(notPermitted)
    await expect(
      api.addDocument(worker, doc({ ownerId: 'y3', homeId: 'h2' })),
    ).rejects.toThrow(notPermitted)
    await expect(
      api.addDocument(worker, doc({ ownerId: 'y2' })),
    ).rejects.toThrow(notPermitted)
    await expect(
      api.addDocument(worker, doc({ ownerId: 'y1', homeId: 'h2' })),
    ).rejects.toThrow(notPermitted)
  })
  it('only shows support workers young people documents', async () => {
    const docs = await api.listDocuments(worker)
    expect(docs.every((d) => d.ownerType === 'young_person')).toBe(true)
    expect(
      (await api.listDocuments(manager)).some((d) => d.ownerType === 'home'),
    ).toBe(true)
  })
})

describe('customisable document categories', () => {
  const names = (list: { name: string }[]) => list.map((c) => c.name)

  it('lets only the Responsible Individual change categories', async () => {
    const input = {
      ownerType: 'staff' as const,
      categories: [{ name: 'Contract' }],
    }
    await expect(api.saveDocumentCategories(manager, input)).rejects.toThrow(
      'Responsible Individuals only',
    )
    await expect(api.saveDocumentCategories(worker, input)).rejects.toThrow(
      'Responsible Individuals only',
    )
  })

  it('validates names', async () => {
    const save = (categories: { name: string }[]) =>
      api.saveDocumentCategories(responsibleIndividual, {
        ownerType: 'home',
        categories,
      })
    await expect(save([])).rejects.toThrow('Keep at least one category')
    await expect(save([{ name: '  ' }])).rejects.toThrow(
      'Category name is required',
    )
    await expect(save([{ name: 'Fire' }, { name: ' fire ' }])).rejects.toThrow(
      'used more than once',
    )
    await expect(save([{ name: 'x'.repeat(61) }])).rejects.toThrow('at most 60')
  })

  it('saves company categories, moves renamed documents and keeps removed ones', async () => {
    const before = (await api.getSettings()).documentCategories.home
    await api.saveDocumentCategories(responsibleIndividual, {
      ownerType: 'home',
      categories: [
        { name: ' Fire   safety ', was: 'Fire risk assessment' },
        { name: 'Local authority visits' },
      ],
    })
    const after = (await api.getSettings()).documentCategories
    expect(after.home).toEqual(['Fire safety', 'Local authority visits'])
    // other file types are untouched
    expect(after.staff.length).toBeGreaterThan(1)

    const docs = await api.listDocuments(responsibleIndividual)
    // renamed category carries its documents across
    expect(docs.find((d) => d.id === 'd2')?.category).toBe('Fire safety')
    // a removed category keeps its documents
    expect(docs.find((d) => d.id === 'd1')?.category).toBe('Other')
    expect((await api.listAuditLog(responsibleIndividual))[0].action).toBe(
      'Updated document categories',
    )

    // restore for other tests
    await api.saveDocumentCategories(responsibleIndividual, {
      ownerType: 'home',
      categories: before.map((name) => ({
        name,
        was: name === 'Fire risk assessment' ? 'Fire safety' : undefined,
      })),
    })
    expect(names(before.map((name) => ({ name })))).toEqual(
      (await api.getSettings()).documentCategories.home,
    )
  })

  it('keeps categories when other settings are saved', async () => {
    await api.saveSettings(responsibleIndividual, {
      name: 'Demo Care Group',
      amberDays: 30,
    })
    expect(
      (await api.getSettings()).documentCategories.young_person.length,
    ).toBeGreaterThan(1)
  })
})
