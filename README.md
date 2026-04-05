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

If you need PostgreSQL and Redis locally:

```bash
npm run infra:up
```

For a full local rehearsal of the production compose topology:

```bash
cp ops/deploy/local-smoke.env.example ops/deploy/local-smoke.env
node ./scripts/deploy/check-env.mjs ops/deploy/local-smoke.env
sh ./scripts/deploy/build-images.sh ops/deploy/local-smoke.env
sh ./scripts/deploy/deploy.sh local ops/deploy/local-smoke.env
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
npm run mcp:playwright:install
npm run mcp:qa
```

## Seeded QA Quickstart

For a repeatable local QA run with a fully restored runtime matrix:

```bash
npm run qa:manual:setup
npm run qa:manual:summary
npm run qa:manual:smoke
npm run mcp:playwright:install
PLAYWRIGHT_BACKEND_MODE=seeded npm run test:e2e:frontend
```

The seeded runtime is designed to cover:

- visitor and public browsing flows from onboarding through home, explore, services, and published professional detail
- major Indonesia metro contexts across Jakarta Selatan, Jakarta Pusat, Tangerang Selatan, Bandung, Surabaya, Bekasi, and Medan
- 3 customer personas with unread notifications, in-flight appointments, and history-heavy states across Jakarta Selatan, Tangerang Selatan, and Surabaya contexts
- 6 professional personas spanning Jakarta Selatan, Surabaya, Tangerang Selatan, Bandung, Medan, and Bekasi plus `published`, `submitted`, `changes_requested`, `verified`, `draft`, and `ready_for_review`
- 4 admin personas across support, reviews, ops, and catalog
- service coverage across `home_visit`, `online`, and `onsite` with both `instant` and `request` booking flows
- all seeded appointment lifecycle states: `requested`, `approved_waiting_payment`, `paid`, `confirmed`, `in_service`, `completed`, `cancelled`, `rejected`, and `expired`

Use these docs together when running manual or automated QA:

- [docs/manual-qa-playbook.md](docs/manual-qa-playbook.md) for the English operator guide
- [docs/manual-qa-playbook.id.md](docs/manual-qa-playbook.id.md) for the Bahasa Indonesia operator guide
- [docs/qa-seed-matrix.md](docs/qa-seed-matrix.md) for exact seeded accounts, route suggestions, and manual test checklists
- [docs/user-flows/README.md](docs/user-flows/README.md) for persona-by-persona product walkthroughs
- [docs/getting-started.md](docs/getting-started.md) for local setup and infra prerequisites

## Development Model

- Backend is the API contract source of truth through Huma.
- `packages/sdk` is the FE-facing transport boundary for generated types, typed REST, realtime helpers, and adapters.
- Frontend navigation is localized through `next-intl` and `@/i18n/routing`.
- Atlas schema and migrations back mutable state plus PostgreSQL-backed public content documents, while `apps/backend/seeddata` now acts as bootstrap import material and test fixtures.
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
- [docs/mcp-workspace.md](docs/mcp-workspace.md)
- [docs/system-flow-diagrams.md](docs/system-flow-diagrams.md)
- [docs/user-facing-flow-diagrams.md](docs/user-facing-flow-diagrams.md)
- [docs/user-flows/README.md](docs/user-flows/README.md)
- [docs/production-rollout.md](docs/production-rollout.md)
- [docs/important-knowledge.md](docs/important-knowledge.md)
