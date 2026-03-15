# Architecture

This document explains how the repository is organized and how the main parts of the system interact.

## 1. Architectural Intent

The codebase is designed around a few deliberate boundaries:

- frontend should focus on UI composition, route handling, and user experience
- backend should define the public API contract and error semantics
- the SDK should be the single FE-facing transport boundary
- generated contract artifacts should come from backend code, not from hand-maintained frontend schemas
- release and deployment should be traceable from issue to branch to PR to tag to image to deploy

The current implementation is transitional by design:

- product data is still largely simulation-backed
- backend persistence is only partially prepared
- chat websocket integration exists today, but persistent message storage does not yet power it

This is acceptable as long as those boundaries remain explicit.

## 2. Monorepo Layout

```text
.
├── apps
│   ├── frontend
│   │   ├── src/app              # localized App Router entrypoints
│   │   ├── src/components       # screens, layout, and shared UI pieces
│   │   ├── src/features         # feature-level sections and hooks
│   │   ├── src/lib              # config, env, routes, backend helpers, simulation adapters
│   │   ├── src/i18n             # locale routing and request helpers
│   │   └── tests                # frontend smoke tests
│   └── backend
│       ├── cmd                  # process entrypoints
│       ├── internal/config      # env loading and validation
│       ├── internal/http        # router and middleware
│       ├── internal/modules     # vertical feature slices
│       ├── internal/platform    # logging, OpenAPI, JSON/error helpers
│       ├── internal/server      # HTTP server lifecycle
│       ├── db                   # schema and migrations
│       └── scripts              # Atlas helper wrapper
├── packages
│   ├── sdk                      # generated contract, typed REST, realtime helpers, adapters
│   └── release                  # product release manifest and changelog
├── scripts
│   ├── ci                       # governance and generated-file checks
│   ├── deploy                   # compose deploy helper
│   └── release                  # release and build metadata scripts
├── ops
│   └── deploy                   # staging and production compose stack
└── docs
```

## 3. Runtime System Overview

At a high level, the runtime looks like this:

```text
Browser
  -> Next.js frontend
  -> @bidanapp/sdk
  -> Go backend
  -> simulation JSON today
  -> PostgreSQL and Redis later
```

For realtime chat:

```text
Browser
  -> frontend websocket helper
  -> /api/v1/ws/chat
  -> in-memory chat hub today
  -> PostgreSQL-backed chat store later
```

## 4. Frontend Boundary

The frontend owns:

- localized route rendering
- page composition
- screen containers
- reusable UI primitives
- frontend-only simulation hydration
- integration diagnostics screen
- public runtime configuration

The frontend should not own:

- backend response schema definitions as a primary source
- raw fetch logic repeated across unrelated screens
- hardcoded cross-locale route strings
- backend error envelope semantics

Key frontend decisions:

- locale-aware navigation is centralized through `@/i18n/routing`
- route shape helpers are centralized in `@/lib/routes.ts`
- large screens are decomposed into screen containers, feature sections, and hooks/action handlers
- backend consumption should flow through `@bidanapp/sdk`

## 5. Backend Boundary

The backend owns:

- HTTP and websocket entrypoints
- config validation
- middleware and security defaults
- success and error envelope conventions
- route registration
- OpenAPI generation
- response schema alignment with actual handlers

The backend currently exposes:

- health and service metadata
- settings
- catalog
- professionals list and detail
- appointments
- chat thread data from simulation JSON
- websocket chat handshake

The backend is implemented using:

- standard-library HTTP primitives
- Huma for route registration and OpenAPI
- middleware chain around `http.ServeMux`
- simulation file readers for current business payloads

## 6. Contract And SDK Flow

This is a core repository flow:

```text
backend route definitions
  -> Huma OpenAPI document
  -> packages/sdk/openapi.json
  -> openapi-typescript generated types
  -> packages/sdk client and adapters
  -> frontend imports from @bidanapp/sdk
```

Important implications:

- backend is the contract source of truth
- OpenAPI is generated, not hand-maintained
- `packages/sdk/openapi.json` is committed so frontend and CI can work without a live backend process
- generated types are committed and guarded by `generated:check`

The SDK intentionally separates:

- generated REST contract
- REST client factory
- websocket helper types
- frontend-facing adapters

This prevents screens from depending directly on low-level transport shapes.

## 7. Realtime Chat Flow

Chat integration follows this split:

- websocket handshake is documented in OpenAPI
- websocket event payload types live in `packages/sdk/src/realtime.ts`
- backend handler accepts connections on `GET /api/v1/ws/chat`
- current live chat hub stores thread history in memory
- backend sends an initial `connected` event, then pushes `message` events

Why this split exists:

- OpenAPI can describe the handshake endpoint
- OpenAPI is not a great fit for bidirectional websocket frame semantics
- the SDK is the right place for FE-consumed realtime event types

## 8. Data Ownership Today

The system currently mixes two realities:

### Live today

- frontend reads simulation content for most product screens
- backend reads the same simulation dataset for demo and contract alignment
- websocket chat works in-memory for FE/BE integration

### Prepared for next phase

- Atlas config exists
- PostgreSQL schema exists for chat threads and chat messages
- deployment stack includes PostgreSQL and Redis
- environment contracts already expose DB and Redis URLs

This means the codebase is ready for staged migration instead of a big-bang rewrite.

## 9. Request Lifecycle Examples

### REST example

For a professionals page backed by the backend:

1. frontend reads runtime API base URL from public env
2. frontend creates a typed client from `@bidanapp/sdk`
3. frontend calls a generated path method such as `GET /professionals`
4. backend route registered through Huma serves the request
5. simulation service reads `catalog.json`
6. response is returned inside a stable `{ data: ... }` envelope
7. frontend adapter or screen renders the normalized result

### Websocket example

For the integration example page:

1. frontend builds a websocket URL with `createChatWebSocketUrl`
2. browser opens a socket against `/api/v1/ws/chat`
3. backend validates the origin and upgrades the connection
4. backend subscribes the client to an in-memory thread
5. server emits a `connected` event with thread history
6. browser sends `message` events
7. hub broadcasts `message` events to subscribers

## 10. Release And Deployment Flow

The intended governance path is:

```text
issue
  -> branch
  -> PR
  -> checks
  -> squash merge to main
  -> changeset release job
  -> git tag vX.Y.Z
  -> Docker image build
  -> staging deploy
  -> manual production deploy
```

Supporting pieces:

- branch naming check
- PR title lint
- issue link check
- changeset check for release-worthy changes
- full CI check
- Docker image metadata export
- compose-based deploy targets

## 11. Current Limitations

- product data is not yet fully persistent
- websocket history is not yet stored in PostgreSQL
- the app deploy stack is ready, but real production operations still require secret management and an external CI or release runner
- `@changesets/changelog-github` still depends on GitHub mirror metadata for richer changelog links

## 12. What Should Change Next

The healthiest next architectural steps are:

1. move more frontend screens to SDK-backed adapters
2. implement repository or query layer for chat persistence
3. keep Atlas schema, backend handlers, and SDK contract aligned during that migration
4. introduce domain-specific adapters in `packages/sdk/src/adapters` as backend coverage grows
5. avoid leaking persistence models directly into frontend DTOs
