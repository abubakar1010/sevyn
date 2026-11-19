import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import type { HomeFieldConfig, HomeFieldDefinition } from '@/types'
import {
  customFieldName,
  groupBySection,
  MAX_LONG_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
} from './customFields'

function FieldControl({
  field,
  value,
  props,
}: {
  field: HomeFieldDefinition
  value: string
  props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }
}) {
  const name = customFieldName(field.id)
  const common = {
    name,
    required: field.required,
    defaultValue: value,
    ...props,
  }
  switch (field.type) {
    case 'long_text':
      return <Textarea maxLength={MAX_LONG_TEXT_LENGTH} {...common} />
    case 'number':
      return <Input type="number" step="any" {...common} />
    case 'date':
      return <Input type="date" {...common} />
    case 'yes_no':
      return (
        <Select {...common}>
          <option value="">Not answered</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </Select>
      )
    case 'dropdown': {
      // Keep a value whose choice has since been removed, so editing a home never wipes it.
      const options = field.options ?? []
      const choices =
        value && !options.includes(value) ? [value, ...options] : options
      return (
        <Select {...common}>
          <option value="">Not chosen</option>
          {choices.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      )
    }
    default:
      return <Input maxLength={MAX_TEXT_LENGTH} {...common} />
  }
}

/** The company's own home fields as form controls, grouped under their section headings. */
export function CustomFieldInputs({
  config,
  values,
}: {
  config: HomeFieldConfig
  values: Record<string, string> | undefined
}) {
  const groups = groupBySection(config).filter((g) => g.fields.length > 0)
  return (
    <>
      {groups.map(({ section, fields }) => (
        <fieldset key={section.id} className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold text-slate-900">
            {section.name}
          </legend>
          {fields.map((f) => (
            <Field key={f.id} label={f.label}>
              {(p) => (
                <FieldControl
                  field={f}
                  value={values?.[f.id] ?? ''}
                  props={p}
                />
              )}
            </Field>
          ))}
        </fieldset>
      ))}
    </>
  )
}
