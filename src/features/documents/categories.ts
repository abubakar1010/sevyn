import type { DocumentOwner } from '@/types'

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
    'Incident reports',
    'Missing person reports',
    "Doctor's letters",
    'Social worker emails',
    'Letters',
    'Other',
  ],
}
