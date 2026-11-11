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

| Page | Admin (responsible individual) | Registered manager | Support worker |
|---|---|---|---|
| Dashboard (compliance) | yes | yes | yes |
| Users, Settings | yes | | |
| Homes (profile + documents) | yes | yes (view, documents) | |
| Staff (files, ready to work) | yes | yes | |
| Training matrix | yes | yes | |
| Young people (files + documents) | | yes | yes |
| Quick logs (with progress graph) | | yes | yes |
| Tasks | yes (assign to managers) | yes (assign to staff) | own tasks |
| Audits | yes | | |
| Policies | yes | yes (choose what workers see) | shared only |
| Interim measures | yes | yes | yes |
| Audit log | yes | yes | |

## Notes
- Documents and certificates only record the file name for now; real storage comes with the backend.
- Document categories are a starter set per owner type; the client will confirm the final list (`src/features/documents/categories.ts`).
- RAG status uses the organisation's amber window (Settings). Staff DBS, safeguarding, training, policy expiry and audit next-due dates all feed the dashboard.
- Progress graph: when logging, each progress area is rated Declined / No change / Progressing; selecting a young person on Quick logs charts the running total per area.
