import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { addInterimMeasure, saveLabels } from '@/data/api'
import { OfstedModeProvider } from '@/features/ofsted-mode/OfstedModeProvider'
import { demoUsers } from '@/data/demoUsers'
import type { Profile } from '@/types'
import { AuthContext } from './useAuth'
import { routes } from './router'

const [responsibleIndividual, manager, worker] = demoUsers

// Every role's routes must render their page heading with demo data and no runtime errors.
const CASES: [Profile, string, string][] = [
  [responsibleIndividual, '/responsible-individual', 'Compliance dashboard'],
  [responsibleIndividual, '/responsible-individual/ofsted', 'Ofsted Mode'],
  [responsibleIndividual, '/responsible-individual/users', 'Users & roles'],
  [responsibleIndividual, '/responsible-individual/homes', 'Homes & units'],
  [responsibleIndividual, '/responsible-individual/staff', 'Staff'],
  [
    responsibleIndividual,
    '/responsible-individual/young-people',
    'Young people',
  ],
  [responsibleIndividual, '/responsible-individual/tasks', 'Tasks'],
  [
    responsibleIndividual,
    '/responsible-individual/training',
    'Training matrix',
  ],
  [
    responsibleIndividual,
    '/responsible-individual/interim-measures',
    'Interim measures',
  ],
  [responsibleIndividual, '/responsible-individual/audits', 'Audits'],
  [responsibleIndividual, '/responsible-individual/policies', 'Policies'],
  [responsibleIndividual, '/responsible-individual/audit-log', 'Audit log'],
  [responsibleIndividual, '/responsible-individual/settings', 'Settings'],
  [manager, '/manager', 'Compliance dashboard'],
  [manager, '/manager/homes', 'Homes & units'],
  [manager, '/manager/young-people', 'Young people'],
  [manager, '/manager/quick-logs', 'Quick logs'],
  [manager, '/manager/tasks', 'Tasks'],
  [manager, '/manager/training', 'Training matrix'],
  [manager, '/manager/staff', 'Staff'],
  [manager, '/manager/interim-measures', 'Interim measures'],
  [manager, '/manager/policies', 'Policies'],
  [manager, '/manager/audit-log', 'Audit log'],
  [worker, '/worker', 'Compliance dashboard'],
  [worker, '/worker/young-people', 'Young people'],
  [worker, '/worker/quick-logs', 'Quick logs'],
  [worker, '/worker/tasks', 'Tasks'],
  [worker, '/worker/policies', 'Policies'],
  [worker, '/worker/interim-measures', 'Interim measures'],
]

describe.each(CASES)('%o', (profile, path, heading) => {
  it(`${profile.role} renders ${path}`, async () => {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <AuthContext
          value={{
            profile,
            loading: false,
            signOut: async () => {},
            signInAs: () => {},
          }}
        >
          <RouterProvider router={router} />
        </AuthContext>
      </QueryClientProvider>,
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Could not load data')).not.toBeInTheDocument()
  })
})

it('support workers cannot open Responsible Individual routes', async () => {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/responsible-individual/users'],
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext
        value={{
          profile: worker,
          loading: false,
          signOut: async () => {},
          signInAs: () => {},
        }}
      >
        <OfstedModeProvider>
          <RouterProvider router={router} />
        </OfstedModeProvider>
      </AuthContext>
    </QueryClientProvider>,
  )
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Compliance dashboard',
    }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/worker')
})

function renderAt(profile: Profile, path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext
        value={{
          profile,
          loading: false,
          signOut: async () => {},
          signInAs: () => {},
        }}
      >
        <OfstedModeProvider>
          <RouterProvider router={router} />
        </OfstedModeProvider>
      </AuthContext>
    </QueryClientProvider>,
  )
}

it('shows audits to the Responsible Individual', async () => {
  renderAt(responsibleIndividual, '/responsible-individual/audits')
  expect(await screen.findByText('Medication audit')).toBeInTheDocument()
})

it('lets managers manage policies and hides audits from them', async () => {
  renderAt(manager, '/manager/policies')
  expect(
    await screen.findByText('Behaviour support policy'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Mark Safeguarding policy reviewed' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Audits' })).not.toBeInTheDocument()
})

it('only shows support workers the policies shared with them', async () => {
  renderAt(worker, '/worker/policies')
  expect(await screen.findByText('Complaints procedure')).toBeInTheDocument()
  expect(screen.queryByText('Behaviour support policy')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /reviewed/ }),
  ).not.toBeInTheDocument()
})

it('moves a measure to history once its item is no longer red', async () => {
  await addInterimMeasure(manager, {
    itemKey: 'dbs:s1',
    note: 'Historic measure note',
  })
  renderAt(manager, '/manager/interim-measures')
  expect(
    await screen.findByRole('heading', { name: 'Closed measures' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Historic measure note')).toBeInTheDocument()
})

it('summarises who is ready to work and filters the staff list', async () => {
  renderAt(manager, '/manager/staff')
  expect(await screen.findByText(/staff ready to work/)).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Open staff file for Jordan Lee' }),
  ).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByLabelText('Show'), 'ready')
  expect(
    screen.queryByRole('button', { name: 'Open staff file for Jordan Lee' }),
  ).not.toBeInTheDocument()
})

it("lets a support worker upload to a young person's file but not delete", async () => {
  renderAt(worker, '/worker/young-people')
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Open file for Demo Young Person One',
    }),
  )
  expect(
    await screen.findByRole('button', { name: 'Upload document' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /^Delete/ }),
  ).not.toBeInTheDocument()
})

it('lets the Responsible Individual rename a document category in Settings', async () => {
  renderAt(responsibleIndividual, '/responsible-individual/settings')
  const box = await screen.findByLabelText('Staff files category name', {
    selector: '[value="Contract"]',
  })
  await userEvent.clear(box)
  await userEvent.type(box, 'Employment contract')
  await userEvent.click(
    screen.getByRole('button', { name: 'Save staff files categories' }),
  )
  expect(await screen.findByText('Saved')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Employment contract')).toBeInTheDocument()
})

it('charts Quick Log ratings for one young person on the dashboard, for each role', async () => {
  for (const [user, path] of [
    [responsibleIndividual, '/responsible-individual'],
    [manager, '/manager'],
    [worker, '/worker'],
  ] as const) {
    const { unmount } = renderAt(user, path)
    expect(
      await screen.findByRole('heading', { name: 'Quick log progress' }),
    ).toBeInTheDocument()
    expect(await screen.findByLabelText('Young person')).toBeInTheDocument()
    expect(
      await screen.findByRole('img', {
        name: /Emotional Wellbeing: \d+ progressing, \d+ no change, \d+ declined/,
      }),
    ).toBeInTheDocument()
    unmount()
  }
})

it("counts only the chosen young person's logs, not the whole home", async () => {
  renderAt(responsibleIndividual, '/responsible-individual')
  const picker = await screen.findByLabelText('Young person')
  await screen.findByRole('option', { name: /Demo Young Person One/ })
  const options = within(picker).getAllByRole('option')
  expect(options.length).toBeGreaterThan(1)
  const seen: string[] = []
  for (const o of options) {
    await userEvent.selectOptions(picker, o)
    await waitFor(() =>
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument(),
    )
    seen.push(
      `${o.textContent}: ${
        screen.queryByText(/No rated logs for this young person/)
          ? 'none'
          : 'rated'
      }`,
    )
  }
  expect(
    seen.some((x) => x.endsWith('none')),
    seen.join('; '),
  ).toBe(true)
  expect(
    seen.some((x) => x.endsWith('rated')),
    seen.join('; '),
  ).toBe(true)
})

it("shows a young person's own progress in their file", async () => {
  renderAt(responsibleIndividual, '/responsible-individual/young-people')
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Open file for Demo Young Person One',
    }),
  )
  const region = await screen.findByRole('region', {
    name: 'Quick log progress',
  })
  expect(
    await within(region).findByRole('img', { name: /Emotional Wellbeing:/ }),
  ).toBeInTheDocument()
})

it('gives the Responsible Individual an inspection pack per home with links to the evidence', async () => {
  renderAt(responsibleIndividual, '/responsible-individual/ofsted')
  expect(
    await screen.findByRole('heading', { name: 'Oakview House' }),
  ).toBeInTheDocument()
  expect(screen.getByText('SC100001')).toBeInTheDocument()
  const navigator = within(
    screen.getByRole('region', { name: 'Inspection navigator' }),
  )
  expect(navigator.getByRole('link', { name: /Staff files/ })).toHaveAttribute(
    'href',
    '/responsible-individual/staff',
  )
  expect(navigator.getByRole('link', { name: /Young people/ })).toHaveAttribute(
    'href',
    '/responsible-individual/young-people',
  )
  await userEvent.selectOptions(screen.getByLabelText('Home'), 'h2')
  expect(
    screen.queryByRole('heading', { name: 'Oakview House' }),
  ).not.toBeInTheDocument()
})

it('offers the Ofsted Mode switch to Responsible Individuals and managers, not support workers', async () => {
  for (const [user, path, expected] of [
    [responsibleIndividual, '/responsible-individual', true],
    [manager, '/manager', true],
    [worker, '/worker', false],
  ] as const) {
    const { unmount } = renderAt(user, path)
    await screen.findByRole('navigation', { name: 'Main' })
    expect(
      screen.queryAllByRole('button', { name: /Ofsted Mode: Off/ }).length > 0,
    ).toBe(expected)
    unmount()
  }
})

it('masks young peoples names for the Responsible Individual when Ofsted Mode is on', async () => {
  renderAt(responsibleIndividual, '/responsible-individual/young-people')
  await screen.findByRole('button', {
    name: 'Open file for Demo Young Person One',
  })
  await userEvent.click(
    screen.getAllByRole('button', { name: /Ofsted Mode: Off/ })[0],
  )
  expect(
    await screen.findByRole('button', { name: 'Open file for A.B.' }),
  ).toBeInTheDocument()
})

it("shows a young person's records by Quality Standard in Ofsted Mode, with names initialled", async () => {
  renderAt(responsibleIndividual, '/responsible-individual/young-people')
  await screen.findByRole('button', {
    name: 'Open file for Demo Young Person One',
  })
  await userEvent.click(
    screen.getAllByRole('button', { name: /Ofsted Mode: Off/ })[0],
  )
  await userEvent.click(
    await screen.findByRole('button', { name: 'Open file for A.B.' }),
  )
  const dialog = within(await screen.findByRole('dialog'))
  for (const group of [
    'Placement',
    'Placing LA & statutory contacts',
    'Care & risk plans',
    'Safeguarding & incidents',
    'Daily support & progress',
  ])
    expect(
      await dialog.findByRole('region', { name: group }),
    ).toBeInTheDocument()
  // statutory contacts and records are shown, not masked
  expect(dialog.getByText('Pat Demo')).toBeInTheDocument()
  expect(dialog.getByText('Chris Demo')).toBeInTheDocument()
  expect(dialog.getByText('Pathway Plan review')).toBeInTheDocument()
  expect(
    dialog.getByText('Missing episode and return home interview'),
  ).toBeInTheDocument()
  expect(dialog.queryByText('••••••')).not.toBeInTheDocument()
  // names: own name initialled, other young people hidden, staff initialled
  expect(dialog.queryByText(/Demo Young Person/)).not.toBeInTheDocument()
  expect(
    await dialog.findByText(
      /Keywork with JL on budgeting\. Disagreement with \[another young person\]/,
    ),
  ).toBeInTheDocument()
  expect(dialog.queryByText(/Sam Taylor|Jordan Lee/)).not.toBeInTheDocument()
})

it('lists each young person in the Ofsted Mode pack with their records', async () => {
  renderAt(responsibleIndividual, '/responsible-individual/ofsted')
  const region = within(
    await screen.findByRole('region', {
      name: "Young people's records by Quality Standard",
    }),
  )
  await userEvent.click(
    screen.getAllByRole('button', { name: /Ofsted Mode: Off/ })[0],
  )
  const toggle = await region.findByRole('button', { name: /A\.B\./ })
  await userEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(
    await region.findAllByRole('region', { name: 'Safeguarding & incidents' }),
  ).not.toHaveLength(0)
  expect(region.queryByText(/Demo Young Person/)).not.toBeInTheDocument()
})

it('links the Staff page and files to the naming settings for the Responsible Individual only', async () => {
  const ri = renderAt(responsibleIndividual, '/responsible-individual/staff')
  expect(
    await screen.findByRole('link', { name: 'Customise names & categories' }),
  ).toHaveAttribute('href', '/responsible-individual/settings#staff-naming')
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Open staff file for Jordan Lee',
    }),
  )
  expect(
    await screen.findByRole('link', { name: 'Edit categories' }),
  ).toHaveAttribute(
    'href',
    '/responsible-individual/settings#document-categories',
  )
  ri.unmount()

  renderAt(manager, '/manager/staff')
  await screen.findByRole('button', { name: 'Open staff file for Jordan Lee' })
  expect(
    screen.queryByRole('link', { name: 'Customise names & categories' }),
  ).not.toBeInTheDocument()
})

describe('company names for staff files and the Homes page', () => {
  afterEach(async () => {
    await saveLabels(responsibleIndividual, { scope: 'staff', labels: {} })
    await saveLabels(responsibleIndividual, { scope: 'homes', labels: {} })
  })

  it('renames built-in labels in Settings and shows them on the pages', async () => {
    const { unmount } = renderAt(
      responsibleIndividual,
      '/responsible-individual/settings',
    )
    const staffCard = within(
      (
        await screen.findByRole('button', { name: 'Save staff files names' })
      ).closest('form')!,
    )
    await userEvent.type(
      staffCard.getByLabelText(/^DBS recheck/),
      'Police check',
    )
    await userEvent.click(
      staffCard.getByRole('button', { name: 'Save staff files names' }),
    )
    expect(await staffCard.findByRole('status')).toHaveTextContent('Saved')

    const homesCard = within(
      screen
        .getByRole('button', { name: 'Save homes page names' })
        .closest('form')!,
    )
    await userEvent.type(
      homesCard.getByLabelText(/^Registered manager/),
      'Home manager',
    )
    await userEvent.click(
      homesCard.getByRole('button', { name: 'Save homes page names' }),
    )
    expect(await homesCard.findByRole('status')).toHaveTextContent('Saved')
    unmount()

    const staffPage = renderAt(
      responsibleIndividual,
      '/responsible-individual/staff',
    )
    expect(
      await screen.findByRole('columnheader', { name: 'Police check' }),
    ).toBeInTheDocument()
    staffPage.unmount()

    renderAt(responsibleIndividual, '/responsible-individual/homes')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Oakview House' }),
    )
    expect(await screen.findByText('Home manager')).toBeInTheDocument()
  })
})

describe('home profile fields in Settings', () => {
  const region = () =>
    within(screen.getByRole('region', { name: 'Home profile fields' }))

  it('lets the Responsible Individual add a dropdown field and save it', async () => {
    renderAt(responsibleIndividual, '/responsible-individual/settings')
    await screen.findByRole('region', { name: 'Home profile fields' })
    await userEvent.click(
      region().getByRole('button', { name: 'Add field to Premises & safety' }),
    )
    const labels = region().getAllByLabelText('Field label')
    const label = labels[labels.length - 1]
    await userEvent.type(label, 'Heating type')
    const types = region().getAllByLabelText('Field type')
    await userEvent.selectOptions(types[types.length - 1], 'dropdown')
    await userEvent.type(
      await region().findByLabelText('Choices (one per line)'),
      'Gas{enter}Electric',
    )
    await userEvent.click(
      region().getByRole('button', { name: 'Save home fields' }),
    )
    expect(await region().findByText('Saved')).toBeInTheDocument()
    expect(
      region().getByRole('button', { name: 'Retire Heating type' }),
    ).toBeInTheDocument()
  })

  it('explains what is wrong instead of saving an unusable field', async () => {
    renderAt(responsibleIndividual, '/responsible-individual/settings')
    await screen.findByRole('region', { name: 'Home profile fields' })
    await userEvent.click(
      region().getByRole('button', { name: 'Add field to Premises & safety' }),
    )
    await userEvent.click(
      region().getByRole('button', { name: 'Save home fields' }),
    )
    expect(await region().findByRole('alert')).toHaveTextContent(
      'Field label is required',
    )
  })

  it('fixes the type of a saved field but lets it be retired', async () => {
    renderAt(responsibleIndividual, '/responsible-individual/settings')
    await screen.findByRole('region', { name: 'Home profile fields' })
    const labels = region().getAllByLabelText('Field label')
    const row = labels.findIndex(
      (l) => (l as HTMLInputElement).value === 'Fire marshal',
    )
    expect(region().getAllByLabelText('Field type')[row]).toBeDisabled()
    await userEvent.click(
      region().getByRole('button', { name: 'Retire Fire marshal' }),
    )
    expect(
      region().getByRole('button', { name: 'Restore Fire marshal' }),
    ).toBeInTheDocument()
    expect(region().getByText('Retired')).toBeInTheDocument()
  })
})

describe('company home fields on the Homes page', () => {
  it('lets the Responsible Individual edit a home’s custom values', async () => {
    renderAt(responsibleIndividual, '/responsible-individual/homes')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Edit Oakview House' }),
    )
    const marshal = await screen.findByLabelText('Fire marshal')
    expect(marshal).toHaveValue('Jordan Lee')
    expect(screen.getByLabelText('Sprinkler system fitted')).toHaveValue('yes')
    await userEvent.clear(marshal)
    await userEvent.type(marshal, 'Sam Patel')
    await userEvent.click(screen.getByRole('button', { name: 'Save home' }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Oakview House' }),
    )
    const detail = within(
      await screen.findByRole('region', { name: 'Premises & safety' }),
    )
    expect(detail.getByText('Sam Patel')).toBeInTheDocument()
  })

  it('shows the fields, but not the way to change them, to a Registered Manager', async () => {
    renderAt(manager, '/manager/homes')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Oakview House' }),
    )
    const detail = within(
      await screen.findByRole('region', { name: 'Premises & safety' }),
    )
    expect(detail.getByText('Sprinkler system fitted')).toBeInTheDocument()
    expect(detail.getByText('Yes')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Customise names & categories' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Edit Oakview House' }),
    ).not.toBeInTheDocument()
  })

  it('links the Responsible Individual to the field settings', async () => {
    renderAt(responsibleIndividual, '/responsible-individual/homes')
    expect(
      await screen.findByRole('link', { name: 'Customise names & categories' }),
    ).toHaveAttribute('href', '/responsible-individual/settings#homes-naming')
  })

  it('includes the fields in the Ofsted Mode pack', async () => {
    renderAt(responsibleIndividual, '/responsible-individual/ofsted')
    const section = within(
      await screen.findByRole('region', { name: 'Premises & safety' }),
    )
    expect(section.getByText('Insurance renewal date')).toBeInTheDocument()
  })
})

it('lists a tracked home date on the dashboard and links it to the homes page', async () => {
  renderAt(responsibleIndividual, '/responsible-individual')
  const link = await screen.findByRole('link', {
    name: 'Insurance renewal date',
  })
  expect(link).toHaveAttribute('href', '/responsible-individual/homes')
})
