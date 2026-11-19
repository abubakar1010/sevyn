import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { useSaveHomeFields } from '@/data/hooks'
import {
  FIELD_TYPE_LABEL,
  MAX_NAME_LENGTH,
  validateFieldConfig,
} from '@/features/homes/customFields'
import type {
  HomeFieldConfig,
  HomeFieldDefinition,
  HomeFieldType,
} from '@/types'

/** Moves the item at `from` to the position of `to`, keeping everything else in order. */
function moveTo<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Lets the Responsible Individual shape the Homes profile: group extra fields under
 * headings they name, choose each field's type, reorder, and retire fields they no
 * longer need. Saved values are never lost: fields are retired rather than deleted.
 */
export function HomeFieldsEditor({ saved }: { saved: HomeFieldConfig }) {
  const save = useSaveHomeFields()
  const [draft, setDraft] = useState<HomeFieldConfig>(() =>
    structuredClone(saved),
  )
  const [error, setError] = useState<Error | null>(null)
  const [newSection, setNewSection] = useState('')

  const savedFieldIds = new Set(saved.fields.map((f) => f.id))
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const setField = (id: string, patch: Partial<HomeFieldDefinition>) =>
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }))

  /** Swaps a field with its neighbour inside the same section. */
  function moveField(id: string, direction: -1 | 1) {
    setDraft((d) => {
      const field = d.fields.find((f) => f.id === id)!
      const peers = d.fields.filter((f) => f.sectionId === field.sectionId)
      const target = peers[peers.indexOf(field) + direction]
      if (!target) return d
      return {
        ...d,
        fields: moveTo(
          d.fields,
          d.fields.indexOf(field),
          d.fields.indexOf(target),
        ),
      }
    })
  }

  function moveSection(id: string, direction: -1 | 1) {
    setDraft((d) => {
      const from = d.sections.findIndex((s) => s.id === id)
      const to = from + direction
      if (to < 0 || to >= d.sections.length) return d
      return { ...d, sections: moveTo(d.sections, from, to) }
    })
  }

  function addSection() {
    const name = newSection.trim()
    if (!name) return
    setDraft((d) => ({
      ...d,
      sections: [...d.sections, { id: crypto.randomUUID(), name }],
    }))
    setNewSection('')
  }

  function addField(sectionId: string) {
    setDraft((d) => ({
      ...d,
      fields: [
        ...d.fields,
        {
          id: crypto.randomUUID(),
          label: '',
          type: 'text',
          sectionId,
          required: false,
        },
      ],
    }))
  }

  function submit() {
    try {
      const cleaned = validateFieldConfig(draft, saved)
      setError(null)
      save.mutate(cleaned, { onSuccess: () => setDraft(cleaned) })
    } catch (e) {
      setError(e as Error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {draft.sections.length === 0 && (
        <p className="text-sm text-slate-600">
          No sections yet. Add a section, then add the fields you want on every
          home.
        </p>
      )}

      {draft.sections.map((s, si) => {
        const fields = draft.fields.filter((f) => f.sectionId === s.id)
        return (
          <Card key={s.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label="Section name"
                value={s.name}
                maxLength={MAX_NAME_LENGTH}
                className="max-w-xs font-semibold"
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    sections: d.sections.map((x) =>
                      x.id === s.id ? { ...x, name: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move section ${s.name} up`}
                disabled={si === 0}
                onClick={() => moveSection(s.id, -1)}
              >
                Up
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move section ${s.name} down`}
                disabled={si === draft.sections.length - 1}
                onClick={() => moveSection(s.id, 1)}
              >
                Down
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove section ${s.name}`}
                disabled={fields.length > 0}
                title={
                  fields.length > 0
                    ? 'Move its fields to another section first'
                    : undefined
                }
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    sections: d.sections.filter((x) => x.id !== s.id),
                  }))
                }
              >
                Remove section
              </Button>
            </div>

            <ul className="mt-3 flex flex-col gap-3">
              {fields.length === 0 && (
                <li className="text-sm text-slate-600">No fields yet.</li>
              )}
              {fields.map((f, fi) => {
                const existing = savedFieldIds.has(f.id)
                return (
                  <li
                    key={f.id}
                    className="flex flex-col gap-3 rounded-lg border border-line p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        aria-label="Field label"
                        placeholder="Field label"
                        value={f.label}
                        maxLength={MAX_NAME_LENGTH}
                        disabled={f.archived}
                        className="max-w-xs"
                        onChange={(e) =>
                          setField(f.id, { label: e.target.value })
                        }
                      />
                      <Select
                        aria-label="Field type"
                        value={f.type}
                        disabled={existing}
                        title={
                          existing
                            ? 'The type is fixed once a field is saved'
                            : undefined
                        }
                        className="max-w-40"
                        onChange={(e) =>
                          setField(f.id, {
                            type: e.target.value as HomeFieldType,
                          })
                        }
                      >
                        {(Object.keys(FIELD_TYPE_LABEL) as HomeFieldType[]).map(
                          (t) => (
                            <option key={t} value={t}>
                              {FIELD_TYPE_LABEL[t]}
                            </option>
                          ),
                        )}
                      </Select>
                      <Select
                        aria-label="Field section"
                        value={f.sectionId}
                        disabled={f.archived}
                        className="max-w-48"
                        onChange={(e) =>
                          setField(f.id, { sectionId: e.target.value })
                        }
                      >
                        {draft.sections.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name || 'Unnamed section'}
                          </option>
                        ))}
                      </Select>
                      {f.archived && <Badge>Retired</Badge>}
                    </div>

                    {f.type === 'dropdown' && (
                      <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
                        Choices (one per line)
                        <Textarea
                          value={(f.options ?? []).join('\n')}
                          disabled={f.archived}
                          onChange={(e) =>
                            setField(f.id, {
                              options: e.target.value.split('\n'),
                            })
                          }
                        />
                      </label>
                    )}

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-5 accent-primary-700"
                          checked={f.required}
                          disabled={f.archived}
                          onChange={(e) =>
                            setField(f.id, { required: e.target.checked })
                          }
                        />
                        Required
                      </label>
                      {f.type === 'date' && (
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-5 accent-primary-700"
                            checked={Boolean(f.trackExpiry)}
                            disabled={f.archived}
                            onChange={(e) =>
                              setField(f.id, { trackExpiry: e.target.checked })
                            }
                          />
                          Show on the dashboard when it is due
                        </label>
                      )}
                      <span className="ml-auto flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Move field ${f.label || 'new field'} up`}
                          disabled={fi === 0}
                          onClick={() => moveField(f.id, -1)}
                        >
                          Up
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Move field ${f.label || 'new field'} down`}
                          disabled={fi === fields.length - 1}
                          onClick={() => moveField(f.id, 1)}
                        >
                          Down
                        </Button>
                        {existing ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`${f.archived ? 'Restore' : 'Retire'} ${f.label}`}
                            onClick={() =>
                              setField(f.id, { archived: !f.archived })
                            }
                          >
                            {f.archived ? 'Restore' : 'Retire'}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Discard ${f.label || 'new field'}`}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                fields: d.fields.filter((x) => x.id !== f.id),
                              }))
                            }
                          >
                            Discard
                          </Button>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              aria-label={`Add field to ${s.name}`}
              onClick={() => addField(s.id)}
            >
              Add field
            </Button>
          </Card>
        )
      })}

      <div className="flex max-w-md items-center gap-2">
        <Input
          aria-label="New section name"
          placeholder="New section, e.g. Premises & safety"
          value={newSection}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setNewSection(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSection()
            }
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!newSection.trim()}
          onClick={addSection}
        >
          Add section
        </Button>
      </div>

      <FormError error={error ?? save.error} />
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={save.isPending || !dirty}>
          Save home fields
        </Button>
        {save.isSuccess && !dirty && (
          <span role="status" className="text-sm text-slate-600">
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
