# Backend Guide

This guide explains how the Go backend is structured, how routes and OpenAPI are defined, what the current modules do, and how PostgreSQL-backed content documents now support the public read-model surfaces.

## 1. Backend Stack

The backend app lives in `apps/backend` and uses:

- Go `1.26`
- standard-library `net/http`
- Huma `v2` for route registration and OpenAPI generation
- `coder/websocket` for websocket chat
- Atlas for schema and migration management

## 2. Directory Structure

```text
apps/backend
├── cmd
│   ├── api                      # main HTTP server entrypoint
│   ├── dev-api                  # lightweight dev server without PostgreSQL dependency
│   └── openapi-export           # exports generated OpenAPI JSON for the SDK
├── db
│   ├── migrations               # Atlas migration files
│   └── schema.sql               # desired schema state
├── seeddata                     # backend-owned normalized seed dataset used for bootstrap import and tests
├── internal
│   ├── config                   # env loading and validation
│   ├── devseed                  # lightweight dev runtime helpers
│   ├── http
│   │   ├── middleware           # middleware chain
│   │   └── router.go            # route composition
│   ├── modules
│   │   ├── adminauth
│   │   ├── appointments
│   │   ├── chat
│   │   ├── clientstate
│   │   ├── customerauth
│   │   ├── health
│   │   ├── professionalauth
│   │   ├── professionalportal
│   │   └── readmodel
│   ├── platform
│   │   ├── contentstore         # public content document storage
│   │   ├── database             # PostgreSQL connection setup
│   │   ├── documentstore        # generic document persistence
│   │   ├── log                  # logger setup
│   │   ├── openapi              # Huma/OpenAPI builder
│   │   ├── portalstore          # professional portal persistence
│   │   ├── ratelimit            # Redis or in-memory auth rate limit
│   │   └── web                  # JSON and API error helpers
│   ├── seeding                  # seeded QA/runtime import helpers
│   └── server                   # HTTP server lifecycle
└── scripts/atlas.sh             # Atlas convenience wrapper
```

## 3. Boot Flow

The process entrypoint is `cmd/api/main.go`.

The startup sequence is:

1. load config through `internal/config`
2. create logger through `internal/platform/log`
3. open the PostgreSQL connection used by runtime mutable state and content documents
4. bootstrap content documents from `seeddata` when missing
5. create the router through `internal/http`
6. create the HTTP server through `internal/server`
7. start the server and log runtime metadata
8. wait for `SIGINT` or `SIGTERM`
9. perform graceful shutdown using configured timeout and close the DB connection

The backend fails fast when configuration is invalid.

For local QA and functionality sweeps, use the runtime seeder:

```bash
npm run seed --workspace @bidanapp/backend
```

For automation-friendly output, use:

```bash
npm run seed:json --workspace @bidanapp/backend
```

The seeder truncates mutable runtime tables, bootstraps `content_documents`, repopulates `app_state_documents`, rebuilds `professional_portal_sessions`, restores chat history, and emits a login/token summary for manual checks.
The JSON report additionally exposes customer, professional, and admin verification matrices so manual QA or smoke scripts can pick the right seeded branch deterministically. See [QA Seed Matrix](./qa-seed-matrix.md).

To smoke the seeded runtime automatically against a real local API process:

```bash
npm run smoke:seeded
```

In `development` and `test`, the API now falls back to an in-memory auth rate limiter when Redis is unavailable so local smoke checks are still runnable. `staging` and `production` remain fail-fast on Redis connection errors.
Cookie-authenticated unsafe requests are also origin-checked, and explicit `Authorization: Bearer ...` headers now take precedence over ambient cookies when both are present.

## 4. Environment Loading

Backend env loading behavior is implemented in `internal/config`.

Load order:

1. real environment variables already present in the shell
2. `apps/backend/.env`
3. `apps/backend/.env.local`
4. `apps/backend/.env.<APP_ENV>`
5. `apps/backend/.env.<APP_ENV>.local`

Existing shell env values win. Files only fill gaps.

Configuration validation covers:

- app name and version
- app environment
- port and timeouts
- max header bytes
- CORS origins
- seed data directory existence
- database URL shape
- Redis URL shape
- log level and log format

See [Environment Setup](./environment.md) for the full variable list.

## 5. Router And Middleware

`internal/http/router.go` composes the service using `http.ServeMux`.

The router currently registers:

- `GET /`
  service metadata and links to docs/OpenAPI
- `GET /api/v1/ws/chat`
  websocket handshake for live chat
- `/api/v1/*`
  Huma-registered REST endpoints built through `internal/platform/openapi`

Middleware chain includes:

- security headers
- CORS
- request ID
- panic recovery
- request logging

## 6. Response And Error Shape

The backend uses a consistent envelope pattern:

### Success

```json
{
  "data": { ... }
}
```

### Error

```json
{
  "error": {
    "code": "invalid_slug",
    "message": "slug must contain only lowercase letters, numbers, and hyphens"
  }
}
```

The API error helper lives in `internal/platform/web/error.go`.

The key rule is that internal error details must not leak into public responses. The router tests explicitly verify error sanitization.

## 7. Module Overview

### `health`

Purpose:

- return service health metadata
- expose service name, version, and environment

Current route:

- `GET /api/v1/health`

### `readmodel`

Purpose:

- serve catalog, professionals, appointments, chat snapshots, and app bootstrap data from PostgreSQL-backed content documents plus persisted overlays
- act as the primary backend read-model boundary while remaining catalog/feed surfaces are still being retired slice by slice
- keep FE and BE aligned around shared contract payloads without reviving old aggregate simulation objects

Current routes:

- `GET /api/v1/catalog`
- `GET /api/v1/professionals`
- `GET /api/v1/professionals/{slug}`
- `GET /api/v1/appointments`
- `GET /api/v1/chat`
- `GET /api/v1/bootstrap`

Important details:

- `ProfessionalBySlug` validates slugs against a strict lowercase, number, and hyphen pattern
- invalid slugs return `400 invalid_slug`
- missing resources return `404 not_found`
- unexpected failures return sanitized `500 internal server error`
- published professional portal data and persisted appointment/request state can overlay the stored content snapshot

### `professionalportal`

Purpose:

- persist professional portal state that used to live only in frontend local storage
- provide backend-owned resource boundaries for dashboard, onboarding, trust, portfolio, request board, and review state flows
- keep FE mutations integrated with BE immediately while PostgreSQL persistence is still being introduced
- project published portal snapshots back into the public read-model so FE public pages can reflect published updates

Current routes:

- `GET /api/v1/professionals/portal/session`
- `PUT /api/v1/professionals/portal/session`
- `GET /api/v1/professionals/me/profile`
- `PUT /api/v1/professionals/me/profile`
- `GET /api/v1/professionals/me/coverage`
- `PUT /api/v1/professionals/me/coverage`
- `GET /api/v1/professionals/me/services`
- `PUT /api/v1/professionals/me/services`
- `GET /api/v1/professionals/me/requests`
- `PUT /api/v1/professionals/me/requests`
- `GET /api/v1/professionals/me/portfolio`
- `PUT /api/v1/professionals/me/portfolio`
- `GET /api/v1/professionals/me/gallery`
- `PUT /api/v1/professionals/me/gallery`
- `GET /api/v1/professionals/me/trust`
- `PUT /api/v1/professionals/me/trust`

Current behavior:

- stores the latest portal snapshot per professional in PostgreSQL
- tracks the last active professional session so FE can restore the latest working state
- lets FE sync the main portal resource slices independently while keeping the session snapshot coherent
- overlays published portal snapshots on top of the public catalog/read-model payloads during backend reads
- returns `200` with `hasSnapshot=false` when a professional has no persisted portal session yet

### `chat`

Purpose:

- accept websocket chat connections
- store recent message history in PostgreSQL
- broadcast messages to subscribers per thread

Current entrypoint:

- `GET /api/v1/ws/chat`

Current behavior:

- accepts optional `thread_id`, `client_id`, and `sender` query parameters
- loads recent thread history from PostgreSQL during websocket connection bootstrap
- emits an initial `connected` event
- emits `message` events for live messages
- persists outbound live messages into PostgreSQL before broadcasting them

### `clientstate`

Purpose:

- persist viewer shell, notification read-state, consumer preferences, admin session, support desk, and admin console documents in PostgreSQL
- expose both aggregate and granular resource boundaries so FE no longer relies on browser-only state for operational flows

Current routes include:

- `GET /api/v1/viewer/session`
- `PUT /api/v1/viewer/session`
- `GET /api/v1/customer/notifications`
- `PUT /api/v1/customer/notifications`
- `GET /api/v1/professional/notifications`
- `PUT /api/v1/professional/notifications`
- `GET /api/v1/preferences/consumer`
- `PUT /api/v1/preferences/consumer`
- `GET /api/v1/admin/session`
- `PUT /api/v1/admin/session`
- `GET /api/v1/admin/support-desk`
- `PUT /api/v1/admin/support-desk`
- `GET /api/v1/admin/console`
- `PUT /api/v1/admin/console`
- `GET /api/v1/admin/console/tables/{table_name}`
- `PUT /api/v1/admin/console/tables/{table_name}`

## 8. OpenAPI And Contract Generation

Backend-generated OpenAPI is built in `internal/platform/openapi/build.go`.

Important behavior:

- Huma uses app name and version from runtime config
- docs are exposed under `/api/v1/docs`
- OpenAPI JSON is exposed under `/api/v1/openapi.json`
- websocket handshake is documented manually inside the Huma OpenAPI object
- websocket event examples are attached as an OpenAPI extension for discoverability

The committed SDK artifact is produced by:

```bash
npm run contract:generate
```

That triggers:

1. `apps/backend/cmd/openapi-export`
2. JSON export to `packages/sdk/openapi.json`
3. `openapi-typescript` generation into `packages/sdk/src/generated/types.ts`

## 9. Database And Atlas Readiness

The backend already includes Atlas configuration:

- `apps/backend/atlas.hcl`
- `apps/backend/db/schema.sql`
- `apps/backend/db/migrations/*`

Current schema contains:

- `chat_threads`
- `chat_messages`
- `professional_portal_sessions`
- `app_state_documents`
- `content_documents`

Current runtime usage:

- chat websocket history persists into `chat_threads` and `chat_messages`
- professional portal session/resource persistence lives in `professional_portal_sessions`
- viewer session, notifications, consumer preferences, admin session, support desk, and admin console snapshots persist into `app_state_documents`
- read-model catalog/bootstrap content persists in `content_documents`, bootstrapped from `seeddata` when missing
- published professional portal snapshots can overlay the stored content documents during reads

## 10. Testing Strategy

Current backend tests include:

- router tests for OpenAPI exposure and error sanitization
- service tests for professional slug validation
- websocket handler test for broadcast behavior

Useful commands:

```bash
go test ./...
npm run atlas:apply --workspace @bidanapp/backend
npm run contract:generate
```

For frontend smoke or route checks without local PostgreSQL, use `go run ./cmd/dev-api`.

## 11. Adding A New Backend Feature

Recommended flow:

1. decide whether the feature is REST, realtime, or both
2. add or update the module under `internal/modules`
3. register routes through Huma or the root mux as appropriate
4. keep success and error envelopes consistent
5. if request or response shape changes, run `npm run contract:generate`
6. add handler, service, and negative tests
7. if persistence changes, align Atlas schema and migrations

## 12. Common Mistakes To Avoid

- hand-editing generated OpenAPI artifacts instead of updating backend code
- returning raw internal errors to clients
- skipping slug or input validation for path-based resource lookup
- putting feature-specific logic directly in the router instead of a module
- assuming bootstrapped content documents remove the need for richer relational/content modeling later
- changing API shape without regenerating the SDK contract
