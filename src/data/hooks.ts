import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/useAuth'
import type { Profile } from '@/types'
import * as api from './api'

function useScoped<T>(key: string, fn: (p: Profile) => Promise<T>) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [key, profile?.id],
    queryFn: () => fn(profile!),
    enabled: profile !== null,
  })
}

function useWrite<A>(
  fn: (p: Profile, args: A) => Promise<unknown>,
  invalidates: string[],
) {
  const { profile } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: A) => fn(profile!, args),
    onSuccess: () =>
      Promise.all(
        invalidates.map((k) => qc.invalidateQueries({ queryKey: [k] })),
      ),
  })
}

export const useHomes = () => useScoped('homes', api.listHomes)
export const useUnits = () => useScoped('units', api.listUnits)
export const useStaff = () => useScoped('staff', api.listStaff)
export const useTrainingRecords = () =>
  useScoped('training', api.listTrainingRecords)
export const useInterimMeasures = () =>
  useScoped('interim', () => api.listInterimMeasures())

export const useAddHome = () => useWrite(api.addHome, ['homes', 'audit'])
export const useAddUnit = () => useWrite(api.addUnit, ['units', 'audit'])
export const useSaveStaff = () => useWrite(api.saveStaff, ['staff', 'audit'])
export const useAddTrainingRecord = () =>
  useWrite(api.addTrainingRecord, ['training', 'audit'])
export const useAddInterimMeasure = () =>
  useWrite(api.addInterimMeasure, ['interim', 'audit'])

export const useYoungPeople = () =>
  useScoped('young-people', api.listYoungPeople)
export const useQuickLogs = () => useScoped('quick-logs', api.listQuickLogs)
export const useTasks = () => useScoped('tasks', api.listTasks)
export const useDocuments = () => useScoped('documents', api.listDocuments)
export const useAuditLog = () =>
  useScoped('audit', async (p) => api.listAuditLog(p))

const AUDIT = ['audit']
export const useSaveYoungPerson = () =>
  useWrite(api.saveYoungPerson, ['young-people', 'quick-logs', ...AUDIT])
export const useAddQuickLog = () =>
  useWrite(api.addQuickLog, ['quick-logs', ...AUDIT])
export const useAddTask = () => useWrite(api.addTask, ['tasks', ...AUDIT])
export const useSetTaskDone = () =>
  useWrite(api.setTaskDone, ['tasks', ...AUDIT])
export const useAddDocument = () =>
  useWrite(api.addDocument, ['documents', ...AUDIT])

export const useUsers = () => useScoped('users', async (p) => api.listUsers(p))
export const useSettings = () => useScoped('settings', () => api.getSettings())

export const useSaveUser = () => useWrite(api.saveUser, ['users', ...AUDIT])
export const useSetUserActive = () =>
  useWrite(api.setUserActive, ['users', ...AUDIT])
export const useSaveSettings = () =>
  useWrite(api.saveSettings, ['settings', ...AUDIT])

/** Organisation's amber window in days; falls back to 30 until settings load. */
export const useAmberDays = () => useSettings().data?.amberDays ?? 30

export const useAudits = () => useScoped('audits', api.listAudits)
export const usePolicies = () => useScoped('policies', () => api.listPolicies())
export const useAddAudit = () => useWrite(api.addAudit, ['audits', ...AUDIT])
export const useSetAuditResolved = () =>
  useWrite(api.setAuditResolved, ['audits', ...AUDIT])
export const useAddPolicy = () =>
  useWrite(api.addPolicy, ['policies', ...AUDIT])
export const useMarkPolicyReviewed = () =>
  useWrite(api.markPolicyReviewed, ['policies', ...AUDIT])

export const useUpdateTask = () => useWrite(api.updateTask, ['tasks', ...AUDIT])
export const useDeleteTask = () => useWrite(api.deleteTask, ['tasks', ...AUDIT])
export const useUpdateQuickLog = () =>
  useWrite(api.updateQuickLog, ['quick-logs', ...AUDIT])
export const useUpdateHome = () => useWrite(api.updateHome, ['homes', ...AUDIT])
export const useDeleteUnit = () => useWrite(api.deleteUnit, ['units', ...AUDIT])
export const useArchiveStaff = () =>
  useWrite(api.archiveStaff, ['staff', 'training', 'interim', ...AUDIT])
export const useArchiveYoungPerson = () =>
  useWrite(api.archiveYoungPerson, ['young-people', 'quick-logs', ...AUDIT])
export const useDeleteDocument = () =>
  useWrite(api.deleteDocument, ['documents', ...AUDIT])
