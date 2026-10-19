import { demoUsers } from './demoUsers'
import * as api from './api'

const [admin, manager, worker] = demoUsers

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
      api.updateHome(manager, { id: 'h1', name: 'X', address: 'Y' }),
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
