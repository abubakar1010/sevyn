import { ragForDate, worstRag } from '@/lib/rag'
import type {
  ComplianceItem,
  InterimMeasure,
  Rag,
  StaffMember,
  TrainingRecord,
} from '@/types'

export function buildComplianceItems(
  staff: StaffMember[],
  training: TrainingRecord[],
  measures: InterimMeasure[],
  now = new Date(),
  amberDays = 30,
): ComplianceItem[] {
  const measureFor = (key: string) =>
    measures.find((m) => m.itemKey === key && m.active)
  const item = (
    key: string,
    homeId: string,
    subject: string,
    label: string,
    due: string | null,
  ): ComplianceItem => {
    const status = ragForDate(due ? new Date(due) : null, now, amberDays)
    return {
      key,
      homeId,
      subject,
      label,
      due,
      status,
      interimMeasure: status === 'red' ? measureFor(key) : undefined,
    }
  }

  const items: ComplianceItem[] = []
  for (const s of staff) {
    items.push(
      item(
        `dbs:${s.id}`,
        s.homeId,
        s.fullName,
        'DBS recheck',
        s.dbsRecheckDate,
      ),
    )
    items.push(
      item(
        `safeguarding:${s.id}`,
        s.homeId,
        s.fullName,
        'Safeguarding training',
        s.safeguardingExpiry,
      ),
    )
  }
  for (const t of training) {
    const s = staff.find((x) => x.id === t.staffId)
    if (s)
      items.push(
        item(`training:${t.id}`, s.homeId, s.fullName, t.course, t.expiresOn),
      )
  }
  return items
}

export function homeStatus(items: ComplianceItem[], homeId: string): Rag {
  return worstRag(items.filter((i) => i.homeId === homeId).map((i) => i.status))
}

export function countByStatus(items: ComplianceItem[]): Record<Rag, number> {
  return items.reduce<Record<Rag, number>>(
    (acc, i) => ({ ...acc, [i.status]: acc[i.status] + 1 }),
    { red: 0, amber: 0, green: 0 },
  )
}
