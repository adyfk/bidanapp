# Seed Data Contract

This repository now uses backend-owned normalized seed tables instead of the old `simulation object` files.

Primary seed folder:

- `apps/backend/seeddata`

Legacy documentation blueprint folder:

- `docs/seed-data`

Primary backend read-model reader:

- `apps/backend/internal/modules/readmodel/service.go`

## Ownership

- Backend owns the normalized seed tables under `apps/backend/seeddata`.
- Supporting documentation, registries, and manifests live under `docs/seed-data`.
- Frontend owns UI-facing selectors and adapters, not the seed tables themselves.
- Backend may read the same table set for read-model and bootstrap endpoints, but that does not make seed data a persistence layer.
- Backend-owned runtime overlays such as professional portal snapshots are backend state, not frontend seed content.

## Current Table Groups

- runtime pointer tables: `app_runtime_selections.json`, `app_section_configs.json`
- catalog tables: `service_categories.json`, `services.json`, `professionals.json`, plus coverage, availability, and cancellation-policy relation tables
- transaction tables: `appointments.json`
- messaging tables: `chat_threads.json`, `chat_messages.json`
- runtime composition tables: `consumers.json`, `user_contexts.json`, `home_feed_*`, `media_presets.json`
- operational tables: `admin_staff.json`, `support_tickets.json`
- reference tables: `reference_*`

## Important Rules

- Do not reintroduce aggregate `simulation` files such as `catalog.json` or `ui.json`.
- UI wording stays in locale files, not in seed data tables.
- App branding and theme stay in code constants, not in seed data tables.
- Seed tables are bootstrap fixtures before full database ownership, not a CMS contract.
- `appointments.json` is the transaction source of truth. Service/order data shown in appointment or professional request surfaces must come from immutable appointment snapshots, not from live catalog lookups.
- Professional request boards are projections of appointment records, not a second transactional source of truth.
- Deprecated local portal fields are removed with schema bumps instead of being migrated forever. When a deprecated structure is dropped, local professional portal snapshots are reset to the current source-of-truth model.
- If backend response shapes change, regenerate `packages/sdk` from backend code instead of hand-editing generated artifacts.

## Migration Direction

- Today: backend-owned seed JSON hydrates read-model/bootstrap endpoints and test fixtures.
- Next: PostgreSQL tables, queries, and real persistence take over mutable domain boundaries first, while seed-backed read-model endpoints are retired slice by slice.
- Goal: remove seed-backed read-model dependencies gradually as each feature moves to backend-owned storage.
