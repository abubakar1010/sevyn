import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { useSaveLabels } from '@/data/hooks'
import {
  cleanLabel,
  LABEL_DEFAULTS,
  MAX_LABEL_LENGTH,
} from '@/features/labels/labels'
import type { LabelScope } from '@/types'

/** Renames the built-in names on one page; a blank name shows the default again. */
export function LabelsCard({
  scope,
  title,
  description,
  saved,
}: {
  scope: LabelScope
  title: string
  description: string
  saved: Record<string, string>
}) {
  const save = useSaveLabels()
  const [draft, setDraft] = useState<Record<string, string>>(() => ({
    ...saved,
  }))
  const value = (id: string) => draft[id] ?? ''
  // A name equal to the default is stored as no rename at all.
  const dirty = LABEL_DEFAULTS[scope].some((l) => {
    const name = cleanLabel(value(l.id))
    return (name === l.default ? '' : name) !== (saved[l.id] ?? '')
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate({ scope, labels: draft })
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {LABEL_DEFAULTS[scope].map((l) => {
            const inputId = `label-${scope}-${l.id}`
            return (
              <li key={l.id} className="flex flex-col gap-1">
                <label
                  htmlFor={inputId}
                  className="text-sm font-medium text-slate-800"
                >
                  {l.default}
                  {l.hint && (
                    <span className="font-normal text-slate-600">
                      {' '}
                      · {l.hint}
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id={inputId}
                    placeholder={l.default}
                    value={value(l.id)}
                    maxLength={MAX_LABEL_LENGTH}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [l.id]: e.target.value }))
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Reset ${l.default} to the default name`}
                    disabled={!value(l.id)}
                    onClick={() => setDraft((d) => ({ ...d, [l.id]: '' }))}
                  >
                    Reset
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
        <FormError error={save.error} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending || !dirty}>
            Save {title.toLowerCase()} names
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
