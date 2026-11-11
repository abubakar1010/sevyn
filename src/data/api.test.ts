import { demoUsers } from './demoUsers'
import * as api from './api'
import { profile } from './mock'
import type { HomeInput } from '@/types'

const [admin, manager, worker] = demoUsers

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
  it('only lets admins edit homes', async () => {
    await expect(
      api.updateHome(manager, { id: 'h1', ...homeInput() }),
    ).rejects.toThrow('Only admins')
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
      api.addHome(admin, homeInput({ ofstedUrn: ' ' })),
    ).rejects.toThrow('Ofsted URN is required')
    await expect(
      api.addHome(admin, homeInput({ approvedCapacity: 0 })),
    ).rejects.toThrow('Approved capacity')
  })
  it('saves the full profile', async () => {
    await api.updateHome(admin, {
      id: 'h3',
      ...homeInput({
        name: 'Maple Court',
        ofstedUrn: 'SC555555',
        ageRange: '14-17',
      }),
    })
    const h = (await api.listHomes(admin)).find((x) => x.id === 'h3')
    expect(h?.ofstedUrn).toBe('SC555555')
    expect(h?.ageRange).toBe('14-17')
  })
})

describe('audits and policies', () => {
  it('limits audits to admins', async () => {
    expect(await api.listAudits(manager)).toEqual([])
    expect((await api.listAudits(admin)).length).toBeGreaterThan(0)
    await expect(
      api.addAudit(manager, {
        homeId: 'h1',
        title: 'X',
        auditDate: '2026-01-01',
        requiredAction: '',
        expiryDate: null,
      }),
    ).rejects.toThrow('Admins only')
  })
  it('rejects a next-due date before the audit date and stores feedback', async () => {
    const base = {
      homeId: 'h1',
      title: 'Fridge check',
      auditDate: '2026-02-01',
      requiredAction: '',
    }
    await expect(
      api.addAudit(admin, { ...base, expiryDate: '2026-01-01' }),
    ).rejects.toThrow('Next due date')
    await api.addAudit(admin, {
      ...base,
      expiryDate: '2026-02-08',
      feedbackFileName: 'fridge.pdf',
    })
    const saved = (await api.listAudits(admin)).find(
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

describe('archive and delete', () => {
  it('archived staff disappear from lists and the change is audited', async () => {
    await api.archiveStaff(manager, { id: 's3' })
    expect((await api.listStaff(admin)).some((s) => s.id === 's3')).toBe(false)
    expect((await api.listAuditLog(admin))[0].action).toBe(
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
    await expect(api.addHome(admin, homeInput({ name: ' ' }))).rejects.toThrow(
      'Home name is required',
    )
  })
  it('rejects duplicate home names and user emails', async () => {
    await expect(
      api.addHome(admin, homeInput({ name: 'oakview house' })),
    ).rejects.toThrow('already exists')
    await expect(
      api.saveUser(admin, {
        fullName: 'Dup',
        email: 'SAM@example.test',
        role: 'support_worker',
        homeIds: ['h1'],
      }),
    ).rejects.toThrow('already exists')
  })
  it('validates user email and home assignment', async () => {
    await expect(
      api.saveUser(admin, {
        fullName: 'A',
        email: 'nope',
        role: 'admin',
        homeIds: [],
      }),
    ).rejects.toThrow('valid email')
    await expect(
      api.saveUser(admin, {
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
