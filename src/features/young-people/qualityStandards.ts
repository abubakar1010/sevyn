import type { QualityStandardGroupId, YoungPersonProfile } from '@/types'

export interface QualityStandardGroup {
  id: QualityStandardGroupId
  title: string
  /** The Quality Standard the evidence sits under. */
  standard: string
  description: string
  /** Profile details shown in this group, in order. */
  fields: (keyof YoungPersonProfile)[]
}

/**
 * How a young person's records are laid out for an inspector. The order follows the
 * client's inspection pack: placement, then statutory contacts, plans, safeguarding,
 * and day-to-day support.
 */
export const QS_GROUPS: QualityStandardGroup[] = [
  {
    id: 'placement',
    title: 'Placement',
    standard: 'Accommodation standard',
    description: 'Move-in date, home and unit.',
    fields: [],
  },
  {
    id: 'contacts',
    title: 'Placing LA & statutory contacts',
    standard: 'Support standard',
    description: 'Social worker, Personal Adviser, IRO and other contacts.',
    fields: [
      'placingAuthority',
      'socialWorkerName',
      'socialWorkerEmail',
      'socialWorkerPhone',
      'socialWorkerOffice',
      'personalAdviserName',
      'personalAdviserContact',
      'iroName',
      'iroContact',
      'keyWorker',
      'nextOfKin',
      'contactRestrictions',
      'otherContacts',
    ],
  },
  {
    id: 'plans',
    title: 'Care & risk plans',
    standard: 'Support standard',
    description:
      'Support / Pathway Plans, risk assessments, placement plan / care status and consents.',
    fields: [
      'legalStatus',
      'careStatus',
      'consents',
      'missingRisk',
      'abscondingProtocol',
    ],
  },
  {
    id: 'safeguarding',
    title: 'Safeguarding & incidents',
    standard: 'Protection standard',
    description:
      'Significant incidents, missing from care and return home interviews, safeguarding referrals, complaints and allegations.',
    fields: [],
  },
  {
    id: 'progress',
    title: 'Daily support & progress',
    standard: 'Support standard',
    description:
      'Quick logs, keywork, health, medication, EET and independence.',
    fields: [
      'preferredName',
      'gender',
      'ethnicity',
      'nhsNumber',
      'school',
      'schoolContact',
      'gpSurgery',
      'allergiesMedical',
      'ehcpStatus',
    ],
  },
]

export const QS_GROUP_IDS = QS_GROUPS.map((g) => g.id)

export const isQsGroupId = (v: unknown): v is QualityStandardGroupId =>
  typeof v === 'string' && (QS_GROUP_IDS as string[]).includes(v)
