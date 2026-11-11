import { HOME_BY_ROLE } from '@/app/homeByRole'
import { ragForDate, worstRag } from '@/lib/rag'
import type {
  ComplianceItem,
  Audit,
  InterimMeasure,
  Policy,
  Rag,
  Role,
  StaffMember,
  TrainingRecord,
} from '@/types'

export function buildComplianceItems(
  staff: StaffMember[],
  training: TrainingRecord[],
  measures: InterimMeasure[],
  now = new Date(),
  amberDays = 30,
  extra: { policies?: Policy[]; audits?: Audit[] } = {},
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
  for (const p of extra.policies ?? []) {
    items.push(item(`policy:${p.id}`, '', 'Policy', p.title, p.reviewDue))
  }
  for (const a of extra.audits ?? []) {
    if (a.expiryDate)
      items.push(
        item(`audit:${a.id}`, a.homeId, 'Audit', a.title, a.expiryDate),
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

/** Pages each role can open, so a dashboard item only links somewhere that exists for them. */
const SECTIONS: Record<Role, string[]> = {
  admin: ['staff', 'training', 'policies', 'audits'],
  registered_manager: ['staff', 'training', 'policies'],
  support_worker: ['policies'],
}

const SECTION_BY_KIND: Record<string, string> = {
  dbs: 'staff',
  safeguarding: 'training',
  training: 'training',
  policy: 'policies',
  audit: 'audits',
}

/** Where to go to action a compliance item, or null when this role has no page for it. */
export function actionPath(key: string, role: Role): string | null {
  const section = SECTION_BY_KIND[key.split(':')[0]]
  return section && SECTIONS[role].includes(section)
    ? `${HOME_BY_ROLE[role]}/${section}`
    : null
}
