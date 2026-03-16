# Mock DB Contract

This repository now uses normalized mock-db tables instead of the old `simulation object` files.

Primary seed folder:

- `apps/frontend/src/data/mock-db`

Documentation blueprint folder:

- `docs/mock-db`

Primary frontend hydration layer:

- `apps/frontend/src/lib/mock-db/catalog.ts`
- `apps/frontend/src/lib/mock-db/appointments.ts`
- `apps/frontend/src/lib/mock-db/chat.ts`
- `apps/frontend/src/lib/mock-db/runtime.ts`

Primary backend demo reader:

- `apps/backend/internal/modules/simulation/service.go`

## Ownership

- Frontend owns the dummy domain data tables under `apps/frontend/src/data/mock-db`.
- Supporting documentation, registries, and manifests live under `docs/mock-db`, not beside runtime seed files.
- Frontend owns the hydration logic that maps table rows into UI-facing shapes.
- Backend may read the same table set for demo and contract endpoints, but that does not make it a persistence layer.

## Current Table Groups

- runtime pointer tables: `app_runtime_selections.json`, `app_section_configs.json`
- catalog tables: `service_categories.json`, `services.json`, `professionals.json`, plus professional relation tables
- transaction tables: `appointments.json`
- messaging tables: `chat_threads.json`, `chat_messages.json`
- runtime composition tables: `consumers.json`, `user_contexts.json`, `home_feed_*`, `media_presets.json`
- reference tables: `reference_*`

## Important Rules

- Do not reintroduce aggregate `simulation` files such as `catalog.json` or `ui.json`.
- UI wording stays in locale files, not in mock-db tables.
- App branding and theme stay in code constants, not in mock-db tables.
- Mock-db tables are dummy abstractions before PostgreSQL, not a CMS contract.
- If backend response shapes change, regenerate `packages/sdk` from backend code instead of hand-editing generated artifacts.

## Migration Direction

- Today: mock-db JSON tables hydrate frontend screens and support backend demo endpoints.
- Next: PostgreSQL tables, queries, and real persistence take over the same domain boundaries.
- Goal: remove mock-db runtime dependencies gradually as each feature moves to backend-owned storage.
