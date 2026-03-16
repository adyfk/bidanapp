# Backend Guide

This guide explains how the Go backend is structured, how routes and OpenAPI are defined, what the current modules do, and how persistence readiness fits into the current architecture.

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
│   └── openapi-export           # exports generated OpenAPI JSON for the SDK
├── db
│   ├── migrations               # Atlas migration files
│   └── schema.sql               # desired schema state
├── internal
│   ├── api/contract             # shared API contract helpers and types
│   ├── config                   # env loading and validation
│   ├── http
│   │   ├── middleware           # middleware chain
│   │   └── router.go            # route composition
│   ├── modules
│   │   ├── chat
│   │   ├── health
│   │   └── simulation
│   ├── platform
│   │   ├── log                  # logger setup
│   │   ├── openapi              # Huma/OpenAPI builder
│   │   └── web                  # JSON and API error helpers
│   └── server                   # HTTP server lifecycle
└── scripts/atlas.sh             # Atlas convenience wrapper
```

## 3. Boot Flow

The process entrypoint is `cmd/api/main.go`.

The startup sequence is:

1. load config through `internal/config`
2. create logger through `internal/platform/log`
3. create the router through `internal/http`
4. create the HTTP server through `internal/server`
5. start the server and log runtime metadata
6. wait for `SIGINT` or `SIGTERM`
7. perform graceful shutdown using configured timeout

The backend fails fast when configuration is invalid.

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
- mock-db data directory existence
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

### `simulation`

Purpose:

- serve catalog, professionals, appointments, and chat data from shared mock-db tables
- act as a bridge while persistent storage is not yet the main source
- keep FE and BE aligned around shared demo payloads

Current routes:

- `GET /api/v1/catalog`
- `GET /api/v1/professionals`
- `GET /api/v1/professionals/{slug}`
- `GET /api/v1/appointments`
- `GET /api/v1/chat`

Important details:

- `ProfessionalBySlug` validates slugs against a strict lowercase, number, and hyphen pattern
- invalid slugs return `400 invalid_slug`
- missing resources return `404 not_found`
- unexpected failures return sanitized `500 internal server error`

### `chat`

Purpose:

- accept websocket chat connections
- store recent message history in memory
- broadcast messages to subscribers per thread

Current entrypoint:

- `GET /api/v1/ws/chat`

Current behavior:

- accepts optional `thread_id`, `client_id`, and `sender` query parameters
- emits an initial `connected` event
- emits `message` events for live messages
- retains up to 50 messages per thread in memory

Important limitation:

- the chat hub does not persist to PostgreSQL yet

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

This schema prepares the repository for persistent chat history, but runtime chat still uses the in-memory hub today.

## 10. Testing Strategy

Current backend tests include:

- router tests for OpenAPI exposure and error sanitization
- service tests for professional slug validation
- websocket handler test for broadcast behavior

Useful commands:

```bash
npm run test --workspace @bidanapp/backend
npm run typecheck --workspace @bidanapp/backend
npm run lint --workspace @bidanapp/backend
```

Because `typecheck` currently uses `go test ./...`, backend correctness is largely covered through compile and test execution together.

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
- assuming the existing chat schema means chat persistence is already implemented
- changing API shape without regenerating the SDK contract
