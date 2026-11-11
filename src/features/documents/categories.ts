import type { DocumentOwner } from '@/types'

/**
 * Fixed category lists, so every company files documents the same way. These are
 * starting lists: the client will confirm the final set, and only this file changes.
 */
export const DOCUMENT_CATEGORIES: Record<DocumentOwner, string[]> = {
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
