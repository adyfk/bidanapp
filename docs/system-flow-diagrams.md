# System Flow Diagrams

This document is the maintenance map for the current BidanApp system.

Use it when you need to:

- understand which layer owns a behavior
- trace a request from browser to storage
- decide where a bug most likely lives
- onboard a new maintainer without walking the whole repository from scratch
- reason about rollout, smoke, and seed flows before changing production paths

Read this together with:

- [Architecture](./architecture.md)
- [Backend Guide](./backend.md)
- [Frontend Guide](./frontend.md)
- [SDK And API Contract](./sdk.md)
- [Production Rollout](./production-rollout.md)
- [QA Seed Matrix](./qa-seed-matrix.md)

## 1. System Context

```mermaid
flowchart LR
  browser["Browser / Mobile Web"] --> frontend["Next.js Frontend<br/>apps/frontend"]
  frontend --> sdk["Typed SDK + Adapters<br/>packages/sdk"]
  sdk --> api["Go API Runtime<br/>apps/backend/cmd/api"]
  frontend --> ws["WebSocket /api/v1/ws/chat"]
  ws --> api
  api --> content["content_documents<br/>public content documents"]
  api --> appstate["app_state_documents<br/>viewer, notifications, admin state"]
  api --> portal["professional_portal_sessions<br/>professional workspace state"]
  api --> chat["chat_threads + chat_messages<br/>realtime history"]
  api --> seed["seeddata JSON<br/>bootstrap import + tests only"]
  seed --> content
```

### Ownership summary

- Frontend owns route rendering, interaction state, and UX composition.
- SDK owns typed transport boundaries between frontend and backend.
- Backend owns API contract, auth, persistence, and error semantics.
- PostgreSQL owns mutable runtime state and public content documents.
- Seed data is no longer the live request-time source of truth; it is import material and QA/test fixture input.

## 2. Monorepo Control Plane

```mermaid
flowchart TB
  subgraph frontend["Frontend App"]
    appRoutes["src/app"]
    screens["src/components + src/features"]
    clientLib["src/lib"]
  end

  subgraph sdk["SDK Package"]
    openapi["openapi.json"]
    generated["src/generated/types.ts"]
    adapters["src/adapters/*"]
  end

  subgraph backend["Backend App"]
    apiMain["cmd/api"]
    router["internal/http/router.go"]
    modules["internal/modules/*"]
    stores["internal/platform/*store"]
    schema["db/schema.sql + migrations"]
  end

  appRoutes --> screens
  screens --> clientLib
  clientLib --> adapters
  adapters --> generated
  openapi --> generated
  apiMain --> router
  router --> modules
  modules --> stores
  stores --> schema
  modules --> openapi
```

### Maintenance note

- If a user-facing bug shows wrong data shape, check `packages/sdk` and backend route contracts first.
- If a page renders the right shape but wrong behavior, check frontend adapters and page-level hooks.
- If persistence is wrong, check the backend module service and its `internal/platform/*store` implementation.

## 3. Backend Runtime Boot Flow

Primary file: `apps/backend/cmd/api/main.go`

```mermaid
flowchart TD
  start["Process start"] --> load["Load and validate config"]
  load --> logger["Create structured logger"]
  logger --> db["Open PostgreSQL connection"]
  db --> contentStore["Create content store"]
  contentStore --> bootstrap["Ensure content documents are bootstrapped"]
  bootstrap --> limiter{"Redis limiter available?"}
  limiter -- "Yes" --> redisLimiter["Use Redis auth limiter"]
  limiter -- "No in development/test" --> memoryLimiter["Fallback to in-memory limiter"]
  limiter -- "No in staging/production" --> fail["Exit process"]
  redisLimiter --> router["Build HTTP router + module services"]
  memoryLimiter --> router
  router --> server["Create HTTP server"]
  server --> serve["Listen and serve"]
  serve --> shutdown["Graceful shutdown on SIGINT/SIGTERM"]
```

### Boot responsibilities

- `config.Load()` is fail-fast and should reject bad production config before runtime starts.
- `readmodel.NewRepository(...).EnsureBootstrapped(...)` guarantees the public content layer exists before serving traffic.
- The auth rate limiter is intentionally strict in staging and production, but developer-friendly in development and test.

## 4. HTTP Request Pipeline

Primary file: `apps/backend/internal/http/router.go`

```mermaid
flowchart LR
  request["Incoming HTTP request"] --> headers["SecurityHeaders"]
  headers --> cors["CORS"]
  cors --> reqid["RequestID"]
  reqid --> recover["Recover"]
  recover --> log["LogRequest"]
  log --> rate["AuthRateLimit"]
  rate --> origin["CookieOriginGuard"]
  origin --> admin["AdminAuth middleware"]
  admin --> customer["CustomerAuth middleware"]
  customer --> professional["ProfessionalAuth middleware"]
  professional --> mux["ServeMux + Huma routes"]
```

### Why this order matters

- Security headers and CORS run before business logic.
- Auth rate limiting happens before login endpoints hit the auth services.
- Cookie origin guard protects unsafe cookie-authenticated requests from cross-site misuse.
- Role middleware enriches request context only when the path belongs to that role domain.

## 5. REST Domain Map

```mermaid
flowchart TB
  router["Router"] --> health["health"]
  router --> readmodel["readmodel"]
  router --> adminAuth["adminauth"]
  router --> customerAuth["customerauth"]
  router --> professionalAuth["professionalauth"]
  router --> appointments["appointments"]
  router --> portal["professionalportal"]
  router --> clientstate["clientstate"]
  router --> chat["chat websocket"]
```

### Route ownership

| Domain | Main purpose | Key endpoints |
| --- | --- | --- |
| `health` | service liveness and metadata | `GET /api/v1/health` |
| `readmodel` | public catalog, professionals, bootstrap, appointments, chat snapshots | `GET /catalog`, `GET /professionals`, `GET /bootstrap`, `GET /appointments`, `GET /chat` |
| `adminauth` | admin login/session lifecycle | `POST/GET/PUT/DELETE /admin/auth/session` |
| `customerauth` | customer account + session lifecycle | `POST /customers/auth/register`, `POST/GET/DELETE /customers/auth/session`, `PUT /customers/auth/account`, `PUT /customers/auth/password` |
| `professionalauth` | professional account + session lifecycle | `POST /professionals/auth/register`, `POST/GET/DELETE /professionals/auth/session`, `PUT /professionals/auth/account`, `PUT /professionals/auth/password` |
| `professionalportal` | professional dashboard and workspace persistence | `GET/PUT /professionals/portal/session`, `GET/PUT /professionals/me/*` |
| `appointments` | appointment mutations backed by portal state | appointment write services exposed through Huma runtime |
| `clientstate` | viewer session, notifications, preferences, admin support and console | `/viewer/session`, `/notifications/*`, `/consumers/preferences`, `/admin/support-desk`, `/admin/console`, `/admin/console/tables/{table_name}` |
| `chat` | realtime thread transport | `GET /api/v1/ws/chat` |

## 6. Public Read Flow

Primary backend files:

- `apps/backend/internal/modules/readmodel/service.go`
- `apps/backend/internal/modules/readmodel/repository.go`
- `apps/backend/internal/platform/contentstore/postgres.go`

Primary frontend files:

- `apps/frontend/src/lib/public-bootstrap.ts`
- `apps/frontend/src/lib/use-catalog-read-model.ts`
- `apps/frontend/src/app/[locale]/home/page.tsx`
- `apps/frontend/src/app/[locale]/explore/page.tsx`
- `apps/frontend/src/app/[locale]/services/page.tsx`

```mermaid
sequenceDiagram
  participant User as "User"
  participant FE as "Frontend route / screen"
  participant SDK as "SDK adapter"
  participant API as "readmodel routes"
  participant Repo as "content repository"
  participant Portal as "portal overlay reader"
  participant DB as "PostgreSQL"

  User->>FE: Open home / explore / service / professional page
  FE->>SDK: Request bootstrap or professionals data
  SDK->>API: GET /bootstrap or GET /professionals
  API->>Repo: Load content_documents payloads
  Repo->>DB: Read content_documents
  API->>Portal: Read published professional overlays
  Portal->>DB: Read professional_portal_sessions
  API-->>SDK: Return normalized { data: ... } payload
  SDK-->>FE: Typed result
  FE-->>User: Render localized page
```

### What changes the public pages

- Seed content affects bootstrap import only, not steady-state requests.
- Published professional portal changes can overlay the stored public content snapshot.
- Frontend public pages should prefer backend bootstrap and read-model helpers, with fallback only as controlled resilience behavior.

## 7. Authentication Flow

All three auth domains follow the same high-level shape with different identity records and scope rules.

```mermaid
sequenceDiagram
  participant User as "Browser"
  participant FE as "Frontend auth screen / hook"
  participant API as "Auth route"
  participant Service as "Auth service"
  participant Store as "document store"
  participant DB as "PostgreSQL"

  User->>FE: Submit credentials
  FE->>API: POST session or register endpoint
  API->>Service: Validate payload + rate limit scope
  Service->>Store: Upsert identity/session document
  Store->>DB: Persist auth document
  Service-->>API: Session payload + raw token
  API-->>User: Set-Cookie + response body
  User->>API: Subsequent authenticated request
  API->>Service: Resolve bearer or cookie session
  Service->>Store: Load session record
  Store->>DB: Read auth document
  API-->>FE: Authorized response
```

### Role-specific sources

- Admin auth uses configured admin credentials plus session records in `app_state_documents`.
- Customer auth persists customer account and session data in document state.
- Professional auth persists professional account and session data and can validate against professional catalog identity.

### Maintenance checkpoints

- If login is failing for all roles, inspect middleware, cookie config, and rate limiter first.
- If only one role breaks, inspect that role's service and route contract.
- If bearer works but cookie does not, inspect cookie config, CORS origins, and cookie origin guard behavior.

## 8. Professional Portal Mutation Flow

Primary files:

- `apps/backend/internal/modules/professionalportal/service.go`
- `apps/backend/internal/platform/portalstore/postgres.go`
- `apps/frontend/src/lib/use-professional-portal.ts`
- `apps/frontend/src/lib/professional-portal-api.ts`
- `apps/frontend/src/features/professional-portal/lib/repository.ts`

```mermaid
sequenceDiagram
  participant Professional as "Professional user"
  participant FE as "Dashboard hook / editor"
  participant SDK as "Portal adapter"
  participant API as "professionalportal routes"
  participant Service as "Portal service"
  participant Store as "portal store"
  participant DB as "PostgreSQL"
  participant ReadModel as "Public read-model overlay"

  Professional->>FE: Edit profile, coverage, services, trust, portfolio, requests
  FE->>SDK: PUT /professionals/me/*
  SDK->>API: Authenticated portal request
  API->>Service: Validate scoped professional id
  Service->>Store: Upsert resource + snapshot
  Store->>DB: Write professional_portal_sessions
  Service-->>API: Persisted resource response
  API-->>FE: Updated portal slice
  Service->>ReadModel: Published state can overlay public catalog data
```

### Why this matters for maintenance

- Portal writes are not isolated drafts anymore; they can influence public read results when state is published.
- Bugs on public professional detail pages can originate in portal persistence, not only in read-model seed content.

## 9. Client State Flow

Primary files:

- `apps/backend/internal/modules/clientstate/service.go`
- `apps/backend/internal/platform/documentstore/postgres.go`
- `apps/frontend/src/lib/app-state-api.ts`
- `apps/frontend/src/lib/use-viewer-session.ts`
- `apps/frontend/src/lib/use-customer-notifications.ts`
- `apps/frontend/src/lib/use-professional-notifications.ts`
- `apps/frontend/src/features/admin/hooks/useAdminConsoleData.ts`

```mermaid
flowchart LR
  frontend["Frontend hooks"] --> sdk["SDK app-state adapters"]
  sdk --> api["clientstate routes"]
  api --> service["ClientState service"]
  service --> documentStore["documentstore.PostgresStore"]
  documentStore --> db["app_state_documents"]
```

### Main state families

- viewer shell state
- customer notification read state
- professional notification read state
- consumer preferences
- admin session
- support desk snapshot
- admin console aggregate snapshot
- admin console table-level resources

### Maintenance rule

- If the problem is per-user persisted shell state, inspect `clientstate`.
- If the problem is public content or directory data, inspect `readmodel`.
- If the problem is professional dashboard workspace state, inspect `professionalportal`.

## 10. Realtime Chat Flow

Primary files:

- `apps/backend/internal/modules/chat/handler.go`
- `apps/backend/internal/modules/chat/hub.go`
- `apps/backend/internal/modules/chat/store_postgres.go`
- `apps/frontend/src/lib/use-realtime-chat-thread.ts`
- `apps/frontend/src/components/screens/ChatScreen.tsx`

```mermaid
sequenceDiagram
  participant Browser as "Browser"
  participant FE as "use-realtime-chat-thread"
  participant WS as "GET /api/v1/ws/chat"
  participant Hub as "chat.Hub"
  participant Store as "chat Postgres store"
  participant DB as "chat_threads + chat_messages"

  Browser->>FE: Open chat screen
  FE->>WS: Open websocket with thread info
  WS->>Store: Load recent thread history
  Store->>DB: Read thread + messages
  WS->>Hub: Subscribe connection to thread
  WS-->>FE: connected event + history
  FE->>WS: Send message frame
  WS->>Store: Persist message
  Store->>DB: Insert chat_messages row
  WS->>Hub: Broadcast message
  Hub-->>FE: message event
```

### Maintenance note

- If messages are missing after refresh, inspect store persistence.
- If live updates fail but history loads, inspect hub subscription or websocket origin handling.
- If read-model chat list is wrong but live thread works, inspect `readmodel.Chat`, not the websocket handler first.

## 11. Seeder And QA Flow

Primary files:

- `apps/backend/cmd/seed/main.go`
- `apps/backend/internal/seeding/seeder.go`
- `apps/backend/internal/seeding/summary.go`
- `scripts/qa/run-seeded-smoke.mjs`

```mermaid
flowchart TD
  seedCommand["go run ./cmd/seed --reset"] --> seeder["Seeder orchestrator"]
  seeder --> truncate["Truncate mutable runtime tables"]
  seeder --> import["Bootstrap content + accounts + portal + app state + chat"]
  import --> summary["Emit deterministic summary report"]
  summary --> smoke["scripts/qa/run-seeded-smoke.mjs"]
  smoke --> checks["27 seeded runtime checks"]
```

### Why maintainers should care

- The seed report is now a truth source for smoke scenarios.
- If a feature looks broken only in QA smoke, compare the seeded scenario assumptions before changing runtime code.

## 12. Deploy And Release Flow

Primary files:

- `scripts/deploy/check-env.mjs`
- `scripts/deploy/build-images.sh`
- `scripts/deploy/apply-migrations.mjs`
- `scripts/deploy/deploy.sh`
- `scripts/deploy/post-deploy-smoke.mjs`
- `ops/deploy/docker-compose.yml`

```mermaid
flowchart TD
  env["Fill env file"] --> validate["check-env.mjs"]
  validate --> build["build-images.sh"]
  build --> deploy["deploy.sh"]
  deploy --> infra["Start postgres + redis"]
  infra --> migrate["apply-migrations.mjs"]
  migrate --> app["Start backend + frontend"]
  app --> smoke["post-deploy-smoke.mjs"]
  smoke --> ready["Deploy rehearsal / target ready"]
```

### Important rollout semantics

- `local-smoke` is a real deployment rehearsal path, not a fake shortcut.
- `deploy.sh` now validates env, brings up database infrastructure first, applies Atlas migrations, then starts app containers.
- `POSTGRES_PORT` is loopback-only and exists to let Atlas reach the deployment database safely from the host.

## 13. Maintenance Entry Points

When a problem appears, start here:

| Symptom | First files to inspect | Likely layer |
| --- | --- | --- |
| Public home/explore/service detail is wrong | `apps/frontend/src/lib/public-bootstrap.ts`, `apps/backend/internal/modules/readmodel/service.go`, `apps/backend/internal/platform/contentstore/postgres.go` | read-model |
| Professional dashboard data disappears after refresh | `apps/frontend/src/lib/use-professional-portal.ts`, `apps/backend/internal/modules/professionalportal/service.go`, `apps/backend/internal/platform/portalstore/postgres.go` | portal persistence |
| Admin login or support desk fails | `apps/frontend/src/features/admin/hooks/useAdminSession.ts`, `apps/backend/internal/modules/adminauth/service.go`, `apps/backend/internal/modules/clientstate/service.go` | admin auth/state |
| Customer profile or preferences fail to persist | `apps/frontend/src/features/profile/hooks/useProfileSettings.ts`, `apps/backend/internal/modules/customerauth/service.go`, `apps/backend/internal/modules/clientstate/service.go` | customer auth/state |
| Realtime chat fails | `apps/frontend/src/lib/use-realtime-chat-thread.ts`, `apps/backend/internal/modules/chat/handler.go`, `apps/backend/internal/modules/chat/hub.go`, `apps/backend/internal/modules/chat/store_postgres.go` | websocket/chat |
| Deploy stack boots but app is unhealthy | `scripts/deploy/deploy.sh`, `scripts/deploy/apply-migrations.mjs`, `ops/deploy/docker-compose.yml`, `apps/backend/cmd/api/main.go` | deploy/runtime bootstrap |

## 14. Recommended Maintenance Loop

1. Identify whether the problem is public read, role auth, role workspace, client state, realtime, or deploy.
2. Find the owning backend module first.
3. Confirm the SDK adapter that frontend uses for that module.
4. Check the persistent store implementation backing that module.
5. Reproduce with either seeded smoke or local deploy smoke before changing code.
6. Update this diagram document when ownership or flow boundaries change.
