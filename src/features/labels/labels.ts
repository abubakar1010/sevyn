import type { LabelScope } from '@/types'

export interface LabelDefinition {
  id: string
  /** The platform's own name, used until the company renames it. */
  default: string
  /** Where the label appears, to help the person renaming it. */
  hint?: string
}

/**
 * Built-in names on staff files and the Homes page that each company may rename.
 * Ids are stable: only the wording changes, never the data underneath.
 */
export const LABEL_DEFAULTS: Record<LabelScope, LabelDefinition[]> = {
  staff: [
    { id: 'staffFile', default: 'Staff file', hint: 'Heading of each file' },
    { id: 'fullName', default: 'Full name' },
    { id: 'jobTitle', default: 'Job title' },
    { id: 'home', default: 'Home' },
    { id: 'address', default: 'Address' },
    {
      id: 'dbs',
      default: 'DBS recheck',
      hint: 'Also shown on the dashboard',
    },
    {
      id: 'safeguarding',
      default: 'Safeguarding training',
      hint: 'Also shown on the dashboard',
    },
    { id: 'compliant', default: 'Compliant to work' },
    { id: 'complianceNote', default: 'Compliance note' },
    { id: 'documents', default: 'Documents', hint: 'Documents on each file' },
  ],
  homes: [
    {
      id: 'homeDetails',
      default: 'Home details',
      hint: 'Heading of each home',
    },
    { id: 'name', default: 'Home name' },
    { id: 'address', default: 'Address' },
    { id: 'ofstedUrn', default: 'Ofsted URN' },
    { id: 'approvedCapacity', default: 'Approved capacity' },
    { id: 'phone', default: 'Home telephone' },
    { id: 'outOfHoursPhone', default: 'Out-of-hours number' },
    { id: 'managerName', default: 'Registered manager' },
    { id: 'managerEmail', default: 'Manager email' },
    { id: 'managerPhone', default: 'Manager phone' },
    { id: 'laContact', default: 'Local authority / LADO' },
    { id: 'ageRange', default: 'Age range' },
    { id: 'genderPermitted', default: 'Gender permitted' },
    { id: 'units', default: 'Units', hint: 'List of units in a home' },
    { id: 'unit', default: 'Unit', hint: 'One unit, e.g. "Add unit"' },
    { id: 'documents', default: 'Documents', hint: 'Documents on each home' },
  ],
}

export const MAX_LABEL_LENGTH = 60

export const cleanLabel = (s: string) => s.trim().replace(/\s+/g, ' ')

export type LabelLookup = (id: string) => string

/** The company's name for a built-in label, falling back to the platform default. */
export function labelLookup(
  scope: LabelScope,
  overrides: Record<string, string> = {},
): LabelLookup {
  const defaults = new Map(LABEL_DEFAULTS[scope].map((l) => [l.id, l.default]))
  return (id) => cleanLabel(overrides[id] ?? '') || defaults.get(id) || id
}

/**
 * Checks a set of renames for one scope and returns only the real overrides: blank
 * values and values equal to the default are dropped, so the default shows again.
 */
export function validateLabels(
  scope: LabelScope,
  input: Record<string, string>,
): Record<string, string> {
  const known = new Map(LABEL_DEFAULTS[scope].map((l) => [l.id, l.default]))
  const out: Record<string, string> = {}
  for (const [id, raw] of Object.entries(input)) {
    if (!known.has(id)) throw new Error(`Unknown label "${id}"`)
    const value = cleanLabel(raw ?? '')
    if (value.length > MAX_LABEL_LENGTH)
      throw new Error(`Names can be at most ${MAX_LABEL_LENGTH} characters`)
    if (value && value !== known.get(id)) out[id] = value
  }
  const lookup = labelLookup(scope, out)
  const seen = new Map<string, string>()
  for (const { id } of LABEL_DEFAULTS[scope]) {
    // Two labels on the same page with one name would be ambiguous.
    const name = lookup(id).toLowerCase()
    if (seen.has(name))
      throw new Error(`"${lookup(id)}" is used more than once`)
    seen.set(name, id)
  }
  return out
}
