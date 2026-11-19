import type { Home, HomeFieldConfig } from '@/types'
import { formatFieldValue, groupBySection } from './customFields'

/** A home's own fields as read-only details, under the section headings the company chose. */
export function CustomFieldValues({
  home,
  config,
}: {
  home: Home
  config: HomeFieldConfig
}) {
  const groups = groupBySection(config).filter((g) => g.fields.length > 0)
  if (groups.length === 0) return null
  return (
    <>
      {groups.map(({ section, fields }) => (
        <section key={section.id} aria-label={section.name} className="mt-5">
          <h3 className="mb-2 text-sm font-semibold">{section.name}</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.id}>
                <dt className="font-medium text-slate-800">{f.label}</dt>
                <dd className="whitespace-pre-wrap text-slate-700">
                  {formatFieldValue(f, home.customFields?.[f.id])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  )
}
