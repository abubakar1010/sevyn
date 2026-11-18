import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { useSaveDocumentCategories } from '@/data/hooks'
import type { DocumentOwner } from '@/types'

interface Row {
  key: number
  name: string
  /** The saved name this row started from; undefined for categories added this session. */
  was?: string
}

let nextKey = 0
const toRows = (names: string[]): Row[] =>
  names.map((name) => ({ key: nextKey++, name, was: name }))

/** Edits the company's category list for one kind of file: rename, add, remove. */
export function DocumentCategoriesCard({
  ownerType,
  title,
  description,
  categories,
}: {
  ownerType: DocumentOwner
  title: string
  description: string
  categories: string[]
}) {
  const save = useSaveDocumentCategories()
  const [rows, setRows] = useState<Row[]>(() => toRows(categories))
  const [newName, setNewName] = useState('')

  const dirty =
    rows.length !== categories.length ||
    rows.some((r, i) => r.name !== categories[i])

  function add() {
    const name = newName.trim()
    if (!name) return
    setRows((r) => [...r, { key: nextKey++, name }])
    setNewName('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(
      {
        ownerType,
        categories: rows.map((r) => ({ name: r.name, was: r.was })),
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
            <li key={r.key} className="flex items-center gap-2">
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
