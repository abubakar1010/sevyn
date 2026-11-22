import { labelLookup, LABEL_DEFAULTS, validateLabels } from './labels'

describe('labelLookup', () => {
  it('uses the company name, falling back to the default', () => {
    const label = labelLookup('staff', { dbs: '  Police   check ' })
    expect(label('dbs')).toBe('Police check')
    expect(label('safeguarding')).toBe('Safeguarding training')
  })
  it('treats a blank name as the default', () => {
    expect(labelLookup('homes', { units: ' ' })('units')).toBe('Units')
  })
})

describe('validateLabels', () => {
  it('keeps only real renames', () => {
    expect(
      validateLabels('homes', {
        units: 'Flats',
        unit: '',
        ofstedUrn: 'Ofsted URN',
      }),
    ).toEqual({ units: 'Flats' })
  })
  it('rejects unknown labels, long names and duplicates', () => {
    expect(() => validateLabels('staff', { nope: 'x' })).toThrow('Unknown')
    expect(() => validateLabels('staff', { dbs: 'x'.repeat(61) })).toThrow(
      'at most 60',
    )
    expect(() => validateLabels('staff', { dbs: 'job title' })).toThrow(
      'used more than once',
    )
  })
  it('has unique default names within each page', () => {
    for (const list of Object.values(LABEL_DEFAULTS)) {
      const names = list.map((l) => l.default.toLowerCase())
      expect(new Set(names).size).toBe(names.length)
    }
  })
})
