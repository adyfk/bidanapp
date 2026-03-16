# BidanApp Monorepo

BidanApp is a monorepo for a localized health-service application. It contains a Next.js frontend, a Go backend that generates the API contract, a shared SDK for typed FE/BE integration, and lightweight Docker templates for local infra and app deployment.

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
│   └── deploy                  # compose templates for staging and production app deployment
├── docs                        # detailed engineering handbook and operational docs
├── scripts                     # CI, release, and deploy helper scripts
├── .codex/skills               # repo-local Codex workflows
└── docker-compose.dev.yml      # optional local Postgres + Redis
```

## Quick Start

```bash
npm install
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/v1/health`
- Backend docs: `http://localhost:8080/api/v1/docs`
- OpenAPI JSON: `http://localhost:8080/api/v1/openapi.json`
- FE/BE example: `http://localhost:3000/id/examples/backend`

If you need PostgreSQL and Redis locally:

```bash
npm run infra:up
```

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

Useful single-app entrypoints:

```bash
npm run dev:frontend
npm run dev:backend
```

## Development Model

- Backend is the API contract source of truth through Huma.
- `packages/sdk` is the FE-facing transport boundary for generated types, typed REST, realtime helpers, and adapters.
- Frontend navigation is localized through `next-intl` and `@/i18n/routing`.
- Atlas schema and migrations are prepared for future persistence, while the frontend still uses normalized `mock-db` seed tables for dummy domain data today.
- Validation is local-first: `npm run ci:check` is the canonical preflight before commit or PR.
- The repository no longer ships a self-hosted Git platform stack. CI/CD can be attached later to any provider that runs the same local commands.

## Codex Skill

The repo includes a lightweight Codex workflow skill at `.codex/skills/bidanapp-preflight`.

Use it when you want Codex to:

- decide the minimum checks before commit
- validate branch, PR title, PR body, and changeset rules
- run `npm run ci:check` or narrower checks when a full run is unnecessary
- summarize release impact before you commit or open a PR

## Documentation

Read [docs/README.md](docs/README.md) first for the full handbook. The most useful guides are:

- [docs/getting-started.md](docs/getting-started.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/frontend.md](docs/frontend.md)
- [docs/backend.md](docs/backend.md)
- [docs/sdk.md](docs/sdk.md)
- [docs/development-workflow.md](docs/development-workflow.md)
- [docs/operations.md](docs/operations.md)
- [docs/environment.md](docs/environment.md)
- [docs/important-knowledge.md](docs/important-knowledge.md)
