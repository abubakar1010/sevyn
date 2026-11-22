import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { useSaveDocumentCategories } from '@/data/hooks'
import { QS_GROUPS } from '@/features/young-people/qualityStandards'
import type { DocumentOwner, QualityStandardGroupId } from '@/types'

interface Row {
  key: number
  name: string
  /** The saved name this row started from; undefined for categories added this session. */
  was?: string
  /** Young people only: where the category's documents show in Ofsted Mode. */
  group: QualityStandardGroupId | ''
}

let nextKey = 0
const toRows = (
  names: string[],
  groups: Record<string, QualityStandardGroupId> = {},
): Row[] =>
  names.map((name) => ({
    key: nextKey++,
    name,
    was: name,
    group: groups[name] ?? '',
  }))

/** Edits the company's category list for one kind of file: rename, add, remove. */
export function DocumentCategoriesCard({
  ownerType,
  title,
  description,
  categories,
  groups,
}: {
  ownerType: DocumentOwner
  title: string
  description: string
  categories: string[]
  /** Pass for young people's files to choose each category's Quality Standard group. */
  groups?: Record<string, QualityStandardGroupId>
}) {
  const save = useSaveDocumentCategories()
  const [rows, setRows] = useState<Row[]>(() => toRows(categories, groups))
  const [newName, setNewName] = useState('')

  const dirty =
    rows.length !== categories.length ||
    rows.some(
      (r, i) =>
        r.name !== categories[i] ||
        (groups !== undefined && r.group !== (groups[r.name] ?? '')),
    )

  function add() {
    const name = newName.trim()
    if (!name) return
    setRows((r) => [...r, { key: nextKey++, name, group: '' }])
    setNewName('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(
      {
        ownerType,
        categories: rows.map((r) => ({
          name: r.name,
          was: r.was,
          ...(groups !== undefined && { group: r.group || null }),
        })),
      },
      {
        onSuccess: () =>
          setRows((r) =>
            r.map((x) => {
              const name = x.name.trim().replace(/\s+/g, ' ')
              return { ...x, name, was: name }
            }),
          ),
      },
    )
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={`${title} category name`}
                value={r.name}
                maxLength={60}
                required
                onChange={(e) =>
                  setRows((all) =>
                    all.map((x) =>
                      x.key === r.key ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              {groups !== undefined && (
                <Select
                  aria-label={`Ofsted Mode group for ${r.name || 'category'}`}
                  value={r.group}
                  className="w-full"
                  onChange={(e) =>
                    setRows((all) =>
                      all.map((x) =>
                        x.key === r.key
                          ? {
                              ...x,
                              group: e.target.value as Row['group'],
                            }
                          : x,
                      ),
                    )
                  }
                >
                  <option value="">Other documents</option>
                  {QS_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </Select>
              )}
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${r.name || 'category'} from ${title}`}
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((all) => all.filter((x) => x.key !== r.key))
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Input
            aria-label={`New ${title} category`}
            placeholder="New category"
            value={newName}
            maxLength={60}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Add category to ${title}`}
            disabled={!newName.trim()}
            onClick={add}
          >
            Add
          </Button>
        </div>
        <FormError error={save.error} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending || !dirty}>
            Save {title.toLowerCase()} categories
          </Button>
          {save.isSuccess && !dirty && (
            <span role="status" className="text-sm text-slate-600">
              Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}
