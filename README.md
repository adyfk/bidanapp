# BidanApp Monorepo

BidanApp is a monorepo for a consumer-facing health service application. It combines a localized Next.js frontend, a Go backend with backend-generated OpenAPI, a shared SDK for REST and realtime integration, and a self-hosted Forgejo-based delivery workflow.

## Repository Map

```text
.
├── apps
│   ├── frontend                # Next.js 16 + React 19 + next-intl
│   └── backend                 # Go 1.26 HTTP API + Huma contract generation
├── packages
│   ├── sdk                     # generated OpenAPI artifact, TS types, REST client, websocket helpers
│   └── release                 # Changesets release manifest and changelog
├── ops
│   ├── deploy                  # compose templates for staging and production app deployment
│   └── platform/forgejo        # self-hosted Forgejo, runner, and reverse proxy stack
├── docs                        # detailed engineering handbook and operational docs
├── scripts                     # CI, release, and deploy helper scripts
└── docker-compose.dev.yml      # optional local Postgres + Redis
```

## Documentation

Read [docs/README.md](docs/README.md) first for the full handbook. The most important guides are:

- [docs/getting-started.md](docs/getting-started.md) for first-time setup and daily local development
- [docs/architecture.md](docs/architecture.md) for monorepo boundaries, runtime flow, and design decisions
- [docs/frontend.md](docs/frontend.md) for route structure, screen composition, and frontend conventions
- [docs/backend.md](docs/backend.md) for API design, modules, OpenAPI generation, and Atlas readiness
- [docs/sdk.md](docs/sdk.md) for FE/BE contract alignment through `@bidanapp/sdk`
- [docs/development-workflow.md](docs/development-workflow.md) for commit, PR, release, and CI/CD rules
- [docs/operations.md](docs/operations.md) for Docker, Forgejo, deploy flow, and operational setup
- [docs/important-knowledge.md](docs/important-knowledge.md) for high-signal rules, pitfalls, and non-obvious facts

Specialized supporting docs remain available:

- [docs/environment.md](docs/environment.md)
- [docs/api-contract.md](docs/api-contract.md)
- [docs/simulation-data-contract.md](docs/simulation-data-contract.md)
- [docs/forgejo-governance.md](docs/forgejo-governance.md)
- [docs/forgejo-platform.md](docs/forgejo-platform.md)

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create local environment files.

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

3. Start the app stack.

```bash
npm run dev
```

4. Open the local URLs.

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/v1/health`
- Backend docs: `http://localhost:8080/api/v1/docs`
- Generated OpenAPI: `http://localhost:8080/api/v1/openapi.json`
- FE/BE integration example: `http://localhost:3000/id/examples/backend`

5. If you need local infrastructure for upcoming persistence work:

```bash
npm run infra:up
```

That starts PostgreSQL `18.1` on `localhost:5432` and Redis `8.6.1` on `localhost:6379`.

## Core Commands

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run test
npm run typecheck
npm run check
npm run ci:check
npm run contract:generate
npm run commit
npm run changeset
npm run release:dry-run
```

Single-app entrypoints:

```bash
npm run dev:frontend
npm run dev:backend
npm run start:frontend
npm run start:backend
```

Equivalent `make` wrappers exist for the most common flows:

```bash
make dev
make check
make infra-up
```

## Current Architecture At A Glance

- Frontend navigation is localized through `next-intl` and `@/i18n/routing`.
- Frontend screens are being split into screen containers, feature sections, and hooks/action handlers.
- Backend is the API contract source of truth through Huma.
- `packages/sdk` is the only FE-facing transport boundary for generated types, typed REST, realtime helpers, and shared adapters.
- OpenAPI is exported from backend route registration into `packages/sdk/openapi.json`, then TypeScript types are regenerated from that artifact.
- The backend and frontend currently share simulation data JSON so product flows can evolve before all domains move to persistent storage.
- Websocket chat works end-to-end for integration and demo purposes, but message storage is still in-memory today.
- Atlas schema and initial migrations are prepared for future chat persistence in PostgreSQL.
- Release and deployment flow is designed around Forgejo, Changesets, Docker images, and compose-based staging/production rollout.

## Important Current State

- Business endpoints are still simulation-backed. Do not assume the current backend is already DB-backed.
- Chat persistence schema exists, but the live websocket hub does not yet write to PostgreSQL.
- Release-worthy work should add a changeset targeting `@bidanapp/release`.
- Git tag `vX.Y.Z` is the operational release identifier used in runtime metadata and Docker image version labels.
- Workspace package versions such as frontend and backend stay private placeholders and are not the product release source of truth.

## Recommended Reading Order

1. [docs/getting-started.md](docs/getting-started.md)
2. [docs/architecture.md](docs/architecture.md)
3. [docs/frontend.md](docs/frontend.md) or [docs/backend.md](docs/backend.md), depending on the area you will touch
4. [docs/sdk.md](docs/sdk.md)
5. [docs/development-workflow.md](docs/development-workflow.md)
6. [docs/operations.md](docs/operations.md) if you will work on CI/CD, Docker, or deployment
