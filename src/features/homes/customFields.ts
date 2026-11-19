import { formatDate } from '@/lib/format'
import type {
  HomeFieldConfig,
  HomeFieldDefinition,
  HomeFieldType,
} from '@/types'

export const FIELD_TYPE_LABEL: Record<HomeFieldType, string> = {
  text: 'Short text',
  long_text: 'Long text',
  number: 'Number',
  date: 'Date',
  yes_no: 'Yes / no',
  dropdown: 'Dropdown',
}

export const MAX_NAME_LENGTH = 60
export const MAX_TEXT_LENGTH = 200
export const MAX_LONG_TEXT_LENGTH = 2000

export const activeFields = (config: HomeFieldConfig) =>
  config.fields.filter((f) => !f.archived)

/** Sections in order, each with its active fields in order; empty sections are kept. */
export function groupBySection(config: HomeFieldConfig) {
  return config.sections.map((section) => ({
    section,
    fields: activeFields(config).filter((f) => f.sectionId === section.id),
  }))
}

const isIsoDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

const tidy = (v: string) => v.trim().replace(/\s+/g, ' ')
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** Human-readable value for display; empty values show as an em dash. */
export function formatFieldValue(
  field: HomeFieldDefinition,
  value: string | undefined,
): string {
  if (!value) return '—'
  if (field.type === 'date') return formatDate(value)
  if (field.type === 'yes_no') return value === 'yes' ? 'Yes' : 'No'
  return value
}

/**
 * Checks one saved value against its field. `previous` is the value already saved, which
 * stays valid even if the dropdown choice it used has since been removed.
 * Returns an error message, or null when the value is acceptable.
 */
export function fieldValueError(
  field: HomeFieldDefinition,
  value: string,
  previous?: string,
): string | null {
  if (!value) return field.required ? `${field.label} is required` : null
  switch (field.type) {
    case 'text':
      return value.length > MAX_TEXT_LENGTH
        ? `${field.label} can be at most ${MAX_TEXT_LENGTH} characters`
        : null
    case 'long_text':
      return value.length > MAX_LONG_TEXT_LENGTH
        ? `${field.label} can be at most ${MAX_LONG_TEXT_LENGTH} characters`
        : null
    case 'number':
      return Number.isFinite(Number(value))
        ? null
        : `${field.label} must be a number`
    case 'date':
      return isIsoDate(value) ? null : `${field.label} must be a valid date`
    case 'yes_no':
      return value === 'yes' || value === 'no'
        ? null
        : `${field.label} must be yes or no`
    case 'dropdown':
      return (field.options ?? []).includes(value) || value === previous
        ? null
        : `${field.label} must be one of the listed choices`
  }
}

/**
 * Validates and cleans the submitted custom values for a home. Retired fields keep their
 * saved values; unknown ids are dropped; empty values are not stored.
 */
export function cleanCustomValues(
  config: HomeFieldConfig,
  submitted: Record<string, string> | undefined,
  previous: Record<string, string> | undefined,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const f of config.fields) {
    const old = previous?.[f.id]
    if (f.archived) {
      if (old) result[f.id] = old
      continue
    }
    // A field the form did not send keeps its saved value.
    const value = (submitted && f.id in submitted ? submitted[f.id] : old) ?? ''
    const clean = value.trim()
    const error = fieldValueError(f, clean, old)
    if (error) throw new Error(error)
    if (clean) result[f.id] = clean
  }
  return result
}

/**
 * Checks a new field setup against the current one and returns it cleaned. Rejects
 * anything that would break saved data (changing a type, deleting a field) or confuse
 * the form (duplicate names, empty dropdowns).
 */
export function validateFieldConfig(
  next: HomeFieldConfig,
  current: HomeFieldConfig,
): HomeFieldConfig {
  const sections = next.sections.map((s) => ({ ...s, name: tidy(s.name) }))
  const fields = next.fields.map((f) => ({ ...f, label: tidy(f.label) }))

  const ids = [...sections, ...fields].map((x) => x.id)
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length)
    throw new Error('Every section and field needs its own id')

  for (const [i, s] of sections.entries()) {
    if (!s.name) throw new Error('Section name is required')
    if (s.name.length > MAX_NAME_LENGTH)
      throw new Error(
        `Section names can be at most ${MAX_NAME_LENGTH} characters`,
      )
    if (sections.findIndex((o) => same(o.name, s.name)) !== i)
      throw new Error(`The section "${s.name}" is used more than once`)
  }
  for (const old of current.sections)
    if (
      !sections.some((s) => s.id === old.id) &&
      fields.some((f) => f.sectionId === old.id)
    )
      throw new Error(
        `Move the fields in "${old.name}" to another section before removing it`,
      )

  for (const f of fields) {
    if (!f.label) throw new Error('Field label is required')
    if (f.label.length > MAX_NAME_LENGTH)
      throw new Error(
        `Field labels can be at most ${MAX_NAME_LENGTH} characters`,
      )
    if (!sections.some((s) => s.id === f.sectionId))
      throw new Error(`Choose a section for "${f.label}"`)
    if (!(f.type in FIELD_TYPE_LABEL))
      throw new Error(`"${f.label}" has an unknown type`)
    const before = current.fields.find((o) => o.id === f.id)
    if (before && before.type !== f.type)
      throw new Error(
        `The type of "${f.label}" cannot change; retire it and add a new field`,
      )
  }
  const active = fields.filter((f) => !f.archived)
  for (const [i, f] of active.entries())
    if (active.findIndex((o) => same(o.label, f.label)) !== i)
      throw new Error(`The field "${f.label}" is used more than once`)
  for (const old of current.fields)
    if (!fields.some((f) => f.id === old.id))
      throw new Error(
        `"${old.label}" cannot be deleted; retire it to keep its saved values`,
      )

  return {
    sections,
    fields: fields.map((f) => {
      let options: string[] | undefined
      if (f.type === 'dropdown') {
        options = (f.options ?? []).map(tidy).filter(Boolean)
        if (options.length === 0)
          throw new Error(`Add at least one choice to "${f.label}"`)
        if (options.some((o, i) => options!.findIndex((x) => same(x, o)) !== i))
          throw new Error(`"${f.label}" has a choice listed more than once`)
        if (options.some((o) => o.length > MAX_NAME_LENGTH))
          throw new Error(
            `Choices can be at most ${MAX_NAME_LENGTH} characters`,
          )
      }
      return {
        id: f.id,
        label: f.label,
        type: f.type,
        sectionId: f.sectionId,
        required: Boolean(f.required),
        ...(options ? { options } : {}),
        ...(f.type === 'date' && f.trackExpiry ? { trackExpiry: true } : {}),
        ...(f.archived ? { archived: true } : {}),
      }
    }),
  }
}
