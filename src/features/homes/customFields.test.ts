import type { HomeFieldConfig, HomeFieldDefinition } from '@/types'
import {
  cleanCustomValues,
  fieldValueError,
  formatFieldValue,
  groupBySection,
  validateFieldConfig,
} from './customFields'

const field = (
  over: Partial<HomeFieldDefinition> & Pick<HomeFieldDefinition, 'id'>,
): HomeFieldDefinition => ({
  label: over.id,
  type: 'text',
  sectionId: 's1',
  required: false,
  ...over,
})

const config = (
  fields: HomeFieldDefinition[],
  sections = [{ id: 's1', name: 'Safety' }],
): HomeFieldConfig => ({ sections, fields })

describe('fieldValueError', () => {
  it('requires a value only when the field is required', () => {
    expect(fieldValueError(field({ id: 'a' }), '')).toBeNull()
    expect(
      fieldValueError(field({ id: 'a', label: 'Marshal', required: true }), ''),
    ).toBe('Marshal is required')
  })
  it('checks each type', () => {
    const err = (f: Partial<HomeFieldDefinition>, v: string) =>
      fieldValueError(field({ id: 'x', label: 'X', ...f }), v)
    expect(err({ type: 'number' }, '12.5')).toBeNull()
    expect(err({ type: 'number' }, 'abc')).toBe('X must be a number')
    expect(err({ type: 'date' }, '2026-02-30x')).toBe('X must be a valid date')
    expect(err({ type: 'date' }, '2026-03-01')).toBeNull()
    expect(err({ type: 'yes_no' }, 'maybe')).toBe('X must be yes or no')
    expect(err({ type: 'yes_no' }, 'no')).toBeNull()
    expect(err({ type: 'text' }, 'x'.repeat(201))).toContain('at most 200')
    expect(err({ type: 'long_text' }, 'x'.repeat(2001))).toContain(
      'at most 2000',
    )
  })
  it('accepts a dropdown choice, or a value already saved before its choice was removed', () => {
    const f = field({
      id: 'd',
      label: 'D',
      type: 'dropdown',
      options: ['A', 'B'],
    })
    expect(fieldValueError(f, 'A')).toBeNull()
    expect(fieldValueError(f, 'C')).toBe('D must be one of the listed choices')
    expect(fieldValueError(f, 'C', 'C')).toBeNull()
  })
})

describe('cleanCustomValues', () => {
  const cfg = config([
    field({ id: 'name', label: 'Name', required: true }),
    field({ id: 'old', label: 'Old', archived: true }),
    field({ id: 'note' }),
  ])

  it('trims, drops empty values and unknown ids, and keeps retired values', () => {
    expect(
      cleanCustomValues(
        cfg,
        { name: '  Jo  ', note: '', ghost: 'x' },
        { old: 'kept', note: 'was here' },
      ),
    ).toEqual({ name: 'Jo', old: 'kept' })
  })
  it('keeps the saved value of a field the form did not send', () => {
    expect(
      cleanCustomValues(cfg, { name: 'Jo' }, { note: 'was here' }),
    ).toEqual({ name: 'Jo', note: 'was here' })
  })
  it('rejects a missing required value', () => {
    expect(() => cleanCustomValues(cfg, {}, undefined)).toThrow(
      'Name is required',
    )
  })
})

describe('validateFieldConfig', () => {
  const current = config([field({ id: 'a', label: 'Alpha' })])
  const check = (next: HomeFieldConfig) => validateFieldConfig(next, current)

  it('tidies names and keeps only the options that apply to each type', () => {
    const out = check(
      config([
        field({ id: 'a', label: '  Alpha  ', trackExpiry: true }),
        field({
          id: 'b',
          label: 'Renewal',
          type: 'date',
          trackExpiry: true,
          options: ['x'],
        }),
        field({
          id: 'c',
          label: 'Pick',
          type: 'dropdown',
          options: [' One ', '', 'Two'],
        }),
      ]),
    )
    expect(out.fields[0]).toEqual({
      id: 'a',
      label: 'Alpha',
      type: 'text',
      sectionId: 's1',
      required: false,
    })
    expect(out.fields[1].trackExpiry).toBe(true)
    expect(out.fields[1].options).toBeUndefined()
    expect(out.fields[2].options).toEqual(['One', 'Two'])
  })

  it('rejects empty, duplicate and over-long names', () => {
    expect(() => check(config([field({ id: 'a', label: ' ' })]))).toThrow(
      'Field label is required',
    )
    expect(() =>
      check(
        config([
          field({ id: 'a', label: 'X' }),
          field({ id: 'b', label: ' x ' }),
        ]),
      ),
    ).toThrow('used more than once')
    expect(() =>
      check(config([field({ id: 'a', label: 'x'.repeat(61) })])),
    ).toThrow('at most 60')
    expect(() =>
      check(
        config(
          [field({ id: 'a' })],
          [
            { id: 's1', name: 'Safety' },
            { id: 's2', name: 'safety' },
          ],
        ),
      ),
    ).toThrow('used more than once')
    expect(() =>
      check(config([field({ id: 'a' })], [{ id: 's1', name: ' ' }])),
    ).toThrow('Section name is required')
  })

  it('lets a retired field reuse a name', () => {
    expect(() =>
      check(
        config([
          field({ id: 'a', label: 'Alpha', archived: true }),
          field({ id: 'b', label: 'Alpha' }),
        ]),
      ),
    ).not.toThrow()
  })

  it('rejects an unknown section and unusable dropdowns', () => {
    expect(() =>
      check(config([field({ id: 'a', label: 'Alpha', sectionId: 'nope' })])),
    ).toThrow('Choose a section')
    expect(() =>
      check(
        config([
          field({ id: 'a', label: 'Alpha' }),
          field({ id: 'n1', label: 'Pick', type: 'dropdown' }),
        ]),
      ),
    ).toThrow('Add at least one choice')
    expect(() =>
      check(
        config([
          field({ id: 'a', label: 'Alpha' }),
          field({
            id: 'n2',
            label: 'Pick',
            type: 'dropdown',
            options: ['A', 'a'],
          }),
        ]),
      ),
    ).toThrow('listed more than once')
  })

  it('does not let a type change or a deletion', () => {
    expect(() =>
      check(config([field({ id: 'a', label: 'Alpha', type: 'number' })])),
    ).toThrow('cannot change')
    expect(() => check(config([]))).toThrow('cannot be deleted')
  })

  it('only removes a section once no field uses it', () => {
    const withTwo: HomeFieldConfig = {
      sections: [
        { id: 's1', name: 'Safety' },
        { id: 's2', name: 'Extra' },
      ],
      fields: [field({ id: 'a', label: 'Alpha', sectionId: 's2' })],
    }
    const onlyS1 = [{ id: 's1', name: 'Safety' }]
    expect(() =>
      validateFieldConfig(
        {
          sections: onlyS1,
          fields: [field({ id: 'a', label: 'Alpha', sectionId: 's2' })],
        },
        withTwo,
      ),
    ).toThrow('Move the fields in "Extra" to another section')
    expect(() =>
      validateFieldConfig(
        {
          sections: onlyS1,
          fields: [field({ id: 'a', label: 'Alpha', sectionId: 's1' })],
        },
        withTwo,
      ),
    ).not.toThrow()
  })

  it('rejects duplicate ids', () => {
    expect(() =>
      check(config([field({ id: 'a' }), field({ id: 'a', label: 'B' })])),
    ).toThrow('own id')
  })
})

describe('display helpers', () => {
  it('groups active fields under their sections in order', () => {
    const groups = groupBySection({
      sections: [
        { id: 's1', name: 'One' },
        { id: 's2', name: 'Two' },
      ],
      fields: [
        field({ id: 'a', sectionId: 's2' }),
        field({ id: 'b', sectionId: 's1' }),
        field({ id: 'c', sectionId: 's2', archived: true }),
        field({ id: 'd', sectionId: 's2' }),
      ],
    })
    expect(groups.map((g) => g.fields.map((f) => f.id))).toEqual([
      ['b'],
      ['a', 'd'],
    ])
  })
  it('formats values for reading', () => {
    expect(formatFieldValue(field({ id: 'a', type: 'yes_no' }), 'yes')).toBe(
      'Yes',
    )
    expect(formatFieldValue(field({ id: 'a', type: 'yes_no' }), 'no')).toBe(
      'No',
    )
    expect(formatFieldValue(field({ id: 'a' }), '')).toBe('—')
    expect(
      formatFieldValue(field({ id: 'a', type: 'date' }), '2026-03-01'),
    ).not.toBe('2026-03-01')
  })
})
