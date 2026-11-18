# Sevyn

Multi-tenant compliance management platform for children's residential and supported
accommodation providers (England). Spec: `docs/`.

Stack: React, TypeScript, Tailwind, Vite; Supabase (Auth, Postgres + RLS, Storage) as backend.

## Setup
```
cp .env.example .env   # fill in Supabase URL + anon key
npm install
npm run dev
```
Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`.

## Layout
- `src/app` – providers, router, layout, role guard
- `src/features/*` – one folder per domain area (dashboard, homes, staff, training, young people, quick logs, tasks, audits, policies, audit log, users, settings)
- `src/features/documents` – shared `DocumentsPanel` (categorised uploads on homes, staff and young people) and the fixed category lists in `categories.ts`
- `src/data` – the data layer. Currently an in-memory mock (`mock.ts`) behind `api.ts`; each function becomes a Supabase query later with the same signature
- `src/lib` – Supabase client, RAG calculation, idle-timeout hook
- `supabase/` – migrations/RLS/functions (later phase)

## Roles and pages
Demo users on the login page cover each role.

| Page | Responsible Individual | Registered manager | Support worker |
|---|---|---|---|
| Dashboard (compliance + quick log progress chart) | yes | yes | yes |
| Ofsted Mode (inspection pack, print view) | yes | | |
| Users, Settings (incl. document categories) | yes | | |
| Homes (profile + documents) | yes | yes (view, documents) | |
| Staff (files, ready to work) | yes | yes | |
| Training matrix | yes | yes | |
| Young people (files + documents) | yes (all homes, incl. restricted) | yes | yes (upload documents, no delete) |
| Quick logs (with progress graph) | | yes | yes |
| Tasks | yes (assign to managers) | yes (assign to staff) | own tasks |
| Audits | yes | | |
| Policies | yes | yes (choose what workers see) | shared only |
| Interim measures | yes | yes | yes |
| Audit log | yes | yes | |

The Ofsted Mode switch (masks staff addresses and young people's names) is available to Responsible Individuals and Registered Managers.

## Notes
- Documents and certificates only record the file name for now; real storage comes with the backend.
- Document categories are set per company: Settings (Responsible Individual) lets each company rename, add and remove the categories for homes, staff and young people. `categories.ts` holds only the starting lists. Renaming updates documents already filed; removing a category keeps its documents.
- Support workers can upload to a young person's file they can open (assigned home, not restricted) and see only young people's documents; every other document action stays with managers and Responsible Individuals.
- RAG status uses the organisation's amber window (Settings). Staff DBS, safeguarding, training, policy expiry and audit next-due dates all feed the dashboard.
- Progress graph: when logging, each progress area is rated Declined / No change / Progressing; selecting a young person on Quick logs charts the running total per area.
- Dashboard quick log chart: counts progressing / no change / declined ratings (last 7, 30 or 90 days, optionally per home), overall and per progress area. It counts ratings, not people, so it names no one.
- Ofsted Mode page: pick a home to see its details, status, staff readiness, occupancy, outstanding items, open audit actions, policy reviews, documents held and recent progress ratings, with links to the evidence pages and a print / save-as-PDF report.
