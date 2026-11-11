import type { YoungPersonProfile } from '@/types'

export interface ProfileField {
  key: keyof YoungPersonProfile
  label: string
  type?: string
  /** Rendered as a multi-line field. */
  long?: boolean
}

export const PROFILE_GROUPS: { title: string; fields: ProfileField[] }[] = [
  {
    title: 'Basic & personal info',
    fields: [
      { key: 'preferredName', label: 'Preferred name' },
      { key: 'gender', label: 'Gender' },
      { key: 'ethnicity', label: 'Ethnicity' },
      { key: 'nhsNumber', label: 'NHS number' },
    ],
  },
  {
    title: 'Legal & placement',
    fields: [
      {
        key: 'legalStatus',
        label: 'Legal status (e.g. Section 20 / Care Order)',
      },
      { key: 'placingAuthority', label: 'Placing local authority' },
      { key: 'iroName', label: 'IRO name' },
      { key: 'iroContact', label: 'IRO contact' },
    ],
  },
  {
    title: 'Key contacts',
    fields: [
      { key: 'keyWorker', label: 'Assigned key worker' },
      { key: 'socialWorkerName', label: 'Social worker name' },
      { key: 'socialWorkerEmail', label: 'Social worker email', type: 'email' },
      { key: 'socialWorkerPhone', label: 'Social worker phone', type: 'tel' },
      { key: 'socialWorkerOffice', label: 'Social worker office address' },
      {
        key: 'nextOfKin',
        label: 'Next of kin / emergency contacts',
        long: true,
      },
      { key: 'contactRestrictions', label: 'Contact restrictions', long: true },
    ],
  },
  {
    title: 'Education & health',
    fields: [
      { key: 'school', label: 'Current school / college' },
      { key: 'schoolContact', label: 'School / college contact' },
      { key: 'gpSurgery', label: 'GP surgery details' },
      {
        key: 'allergiesMedical',
        label: 'Allergies & medical notes',
        long: true,
      },
      { key: 'ehcpStatus', label: 'EHCP status' },
    ],
  },
  {
    title: 'Risk & safety',
    fields: [
      { key: 'missingRisk', label: 'Missing persons risk notes', long: true },
      { key: 'abscondingProtocol', label: 'Absconding protocol', long: true },
    ],
  },
]
