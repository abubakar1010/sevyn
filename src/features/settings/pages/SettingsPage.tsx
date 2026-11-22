import { useEffect, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { QueryState } from '@/components/ui/QueryState'
import { useSaveSettings, useSettings } from '@/data/hooks'
import { DocumentCategoriesCard } from '../DocumentCategoriesCard'
import { HomeFieldsEditor } from '../HomeFieldsEditor'
import { LabelsCard } from '../LabelsCard'

export function SettingsPage() {
  const settings = useSettings()
  const save = useSaveSettings()
  const { hash } = useLocation()
  const loaded = settings.data !== undefined

  // Links from the Staff and Homes pages land on the matching section once it renders.
  useEffect(() => {
    if (!loaded || !hash) return
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView?.({ block: 'start' })
  }, [loaded, hash])

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    save.mutate({
      name: String(f.get('name')).trim(),
      amberDays: Number(f.get('amberDays')),
    })
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation settings, compliance rules and how your files are organised."
      />
      <QueryState queries={[settings]}>
        {settings.data && (
          <Card className="max-w-lg">
            <form
              key={settings.dataUpdatedAt}
              onSubmit={submit}
              className="flex flex-col gap-4"
            >
              <Field label="Organisation name">
                {(p) => (
                  <Input
                    name="name"
                    required
                    defaultValue={settings.data.name}
                    {...p}
                  />
                )}
              </Field>
              <Field
                label="Amber warning window (days)"
                hint="Items turn amber this many days before they expire."
              >
                {(p) => (
                  <Input
                    name="amberDays"
                    type="number"
                    min={1}
                    max={365}
                    required
                    defaultValue={settings.data.amberDays}
                    {...p}
                  />
                )}
              </Field>
              <Field
                label="Inactivity timeout"
                hint="Fixed at 10 minutes for security."
              >
                {(p) => <Input value="10 minutes" readOnly disabled {...p} />}
              </Field>
              <div className="flex items-center gap-3">
                <FormError error={save.error} />
                <Button type="submit" disabled={save.isPending}>
                  Save settings
                </Button>
                {save.isSuccess && (
                  <span role="status" className="text-sm text-slate-600">
                    Saved
                  </span>
                )}
              </div>
            </form>
          </Card>
        )}
        {settings.data && (
          <section
            id="naming"
            aria-label="Staff file and Homes page naming"
            className="mt-8 scroll-mt-24"
          >
            <h2 className="text-lg font-semibold">
              Staff file and Homes page naming
            </h2>
            <p className="mb-4 max-w-2xl text-sm text-slate-600">
              Use your company’s own names for the built-in fields and headings
              on staff files and the Homes page. Only the wording changes; the
              information underneath stays the same. Leave a name blank to use
              the default.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div id="staff-naming" className="scroll-mt-24">
                <LabelsCard
                  scope="staff"
                  title="Staff files"
                  description="Names on the Staff page and each staff file."
                  saved={settings.data.labels.staff}
                />
              </div>
              <div id="homes-naming" className="scroll-mt-24">
                <LabelsCard
                  scope="homes"
                  title="Homes page"
                  description="Names on the Homes page, each home and the Ofsted Mode pack."
                  saved={settings.data.labels.homes}
                />
              </div>
            </div>
          </section>
        )}
        {settings.data && (
          <section
            id="document-categories"
            aria-label="Document categories"
            className="mt-8 scroll-mt-24"
          >
            <h2 className="text-lg font-semibold">Document categories</h2>
            <p className="mb-4 max-w-2xl text-sm text-slate-600">
              Name the categories your teams file documents under. Renaming a
              category updates the documents already filed under it; removing
              one keeps its documents, but it is no longer offered for new
              uploads.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              <DocumentCategoriesCard
                ownerType="home"
                title="Homes"
                description="Documents held on each home."
                categories={settings.data.documentCategories.home}
              />
              <DocumentCategoriesCard
                ownerType="staff"
                title="Staff files"
                description="Documents held on each staff member."
                categories={settings.data.documentCategories.staff}
              />
              <DocumentCategoriesCard
                ownerType="young_person"
                title="Young people"
                description="Documents held on each young person. Choose the Ofsted Mode group each category is shown under."
                categories={settings.data.documentCategories.young_person}
                groups={settings.data.youngPersonCategoryGroups}
              />
            </div>
          </section>
        )}
        {settings.data && (
          <section aria-label="Home profile fields" className="mt-8">
            <h2 className="text-lg font-semibold">Home profile fields</h2>
            <p className="mb-4 max-w-2xl text-sm text-slate-600">
              Add your own fields to every home's profile and group them under
              headings you name. Choose a type for each, mark it required, and
              for dates choose whether it appears on the dashboard when due.
              Fields are retired rather than deleted, so saved values are never
              lost. Name, address, Ofsted URN and capacity are always present.
            </p>
            <HomeFieldsEditor saved={settings.data.homeFields} />
          </section>
        )}
      </QueryState>
    </>
  )
}
