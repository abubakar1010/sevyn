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
- `src/features/*` – one folder per domain area (placeholder pages)
- `src/lib` – Supabase client, RAG calculation, idle-timeout hook
- `supabase/` – migrations/RLS/functions (later phase)
