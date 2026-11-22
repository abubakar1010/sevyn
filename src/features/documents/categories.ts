import type { DocumentOwner, QualityStandardGroupId } from '@/types'

/**
 * Starting category lists given to every new company. Each company can rename, add
 * and remove categories in Settings; those lists live in the organisation's settings.
 */
export const DEFAULT_DOCUMENT_CATEGORIES: Record<DocumentOwner, string[]> = {
  home: [
    'Fire risk assessment',
    'Certificates',
    'Health & safety',
    'Insurance',
    'Inspection reports',
    'Maintenance records',
    'Other',
  ],
  staff: [
    'Application form',
    'Interview notes',
    'Offer letter',
    'Contract',
    '48-hour opt-out agreement',
    'References',
    'ID & right to work',
    'DBS',
    'Other',
  ],
  young_person: [
    'Moving-in documents',
    'Inventory list',
    'Tenancy agreement',
    'Support Plan',
    'Pathway Plan',
    'Risk assessments',
    'Placement Plan',
    'Consents',
    'Significant incidents',
    'Incident reports',
    'Missing from care & return home interviews',
    'Missing person reports',
    'Safeguarding referrals',
    'Complaints & allegations',
    'Keywork sessions',
    'Health',
    'Medication',
    "Doctor's letters",
    'Education, employment & training (EET)',
    'Independence skills',
    'Social worker emails',
    'Letters',
    'Other',
  ],
}

/** Starting Quality Standard group for each default young people's category. */
export const DEFAULT_YOUNG_PERSON_CATEGORY_GROUPS: Record<
  string,
  QualityStandardGroupId
> = {
  'Moving-in documents': 'placement',
  'Inventory list': 'placement',
  'Tenancy agreement': 'placement',
  'Support Plan': 'plans',
  'Pathway Plan': 'plans',
  'Risk assessments': 'plans',
  'Placement Plan': 'plans',
  Consents: 'plans',
  'Significant incidents': 'safeguarding',
  'Incident reports': 'safeguarding',
  'Missing from care & return home interviews': 'safeguarding',
  'Missing person reports': 'safeguarding',
  'Safeguarding referrals': 'safeguarding',
  'Complaints & allegations': 'safeguarding',
  'Keywork sessions': 'progress',
  Health: 'progress',
  Medication: 'progress',
  "Doctor's letters": 'progress',
  'Education, employment & training (EET)': 'progress',
  'Independence skills': 'progress',
  'Social worker emails': 'contacts',
}
