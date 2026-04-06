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

## Script Guide

This section is meant to be the quick memory refresh when you open the repo again later.

### Daily development

- `npm run dev`
  Runs frontend and backend together through Turborepo.
- `npm run dev:frontend`
  Runs only the Next.js frontend.
- `npm run dev:backend`
  Runs only the Go backend.
- `npm run build`
  Builds all workspace packages and apps.
- `npm run lint`
  Runs the repo lint flow.
- `npm run typecheck`
  Runs workspace type checking.
- `npm run test`
  Runs the default test suites.
- `npm run check`
  Runs the standard local quality gate: lint, typecheck, i18n audit, tests, and build.
- `npm run ci:check`
  Runs the broader CI-style validation flow, including contract generation and generated-file checks.

### Seeded QA data setup

- `npm run qa:manual:setup`
  Brings up local infra, applies backend migrations, and reseeds the backend to the canonical manual-QA dataset. Use this before any deterministic QA pass.
- `npm run qa:manual:summary`
  Prints the machine-readable summary of the seeded QA pack so you can confirm actors, states, and coverage after reseeding.
- `npm run qa:manual:smoke`
  Runs the lightweight seeded smoke pass used as a quick backend or runtime sanity check before heavier browser work.
- `npm run mcp:playwright:install`
  Installs the Playwright Chromium browser used by local E2E and MCP browser automation. Usually needed once per machine.

### Browser E2E and debugging

- `npm run test:e2e:frontend`
  Runs the frontend Playwright suite with default settings.
- `npm run test:e2e:frontend:headed`
  Runs the same E2E suite in headed mode for manual observation.
- `npm run test:e2e:frontend:trace`
  Runs E2E while writing Playwright trace artifacts for debugging.
- `npm run test:e2e:frontend:trace:seeded`
  Runs the seeded QA matrix with Playwright traces enabled.
- `npm run trace:show:frontend`
  Opens the newest trace archive found under frontend test artifacts.
- `npm run trace:show:frontend -- <CASE-ID>`
  Opens the newest trace that matches one case such as `PUB-01` or `PRO-03`.

### Storyboard documentation workflow

- `npm run test:e2e:frontend:evidence`
  Runs browser E2E and writes raw evidence under `apps/frontend/allure-results`.
- `npm run test:e2e:frontend:evidence:seeded`
  Runs the seeded manual-QA matrix and writes the raw evidence used by the storyboard generator. It also clears the previous summary output and sweeps leftover legacy report folders before each run.
- `npm run manual-qa:summary:generate:frontend`
  Generates the custom storyboard page under `apps/frontend/manual-qa-summary` from the raw evidence results.
- `npm run manual-qa:summary:open:frontend`
  Opens the generated storyboard page locally.

### QA flow to remember

Use this order when you want the seeded browser flow from start to finish:

1. `npm run qa:manual:setup`
2. `npm run mcp:playwright:install`
3. `npm run test:e2e:frontend:evidence:seeded`
4. `npm run manual-qa:summary:generate:frontend`
5. `npm run manual-qa:summary:open:frontend`
6. Optional: `npm run trace:show:frontend -- <CASE-ID>` for deep debugging

### Important QA folders

- `apps/frontend/allure-results`
  Raw evidence cache produced by the `allure-playwright` reporter. This is input data, not a final report meant for reading directly.
- `apps/frontend/manual-qa-summary`
  The final storyboard-style HTML document generated from the raw evidence.
- `apps/frontend/test-results`
  Playwright runtime artifacts such as traces, screenshots, and videos.

Important note:

- the output folder still uses the name `allure-results` because it is produced by the `allure-playwright` raw reporter
- this repo no longer has Playwright HTML report or Allure HTML report workflows
- treat `allure-results` as internal evidence storage for the storyboard generator

## Seeded QA Quickstart

For a repeatable local QA run with a fully restored runtime matrix:

```bash
npm run qa:manual:setup
npm run qa:manual:summary
npm run qa:manual:smoke
npm run mcp:playwright:install
npm run test:e2e:frontend:evidence:seeded
npm run manual-qa:summary:generate:frontend
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
- [docs/qa-visual-reporting.md](docs/qa-visual-reporting.md) for the trimmed storyboard and trace workflow
- [docs/playwright-trace-viewer.md](docs/playwright-trace-viewer.md) for case-by-case Trace Viewer usage in lightweight and seeded mode
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
- [docs/qa-visual-reporting.md](docs/qa-visual-reporting.md)
- [docs/playwright-trace-viewer.md](docs/playwright-trace-viewer.md)
- [docs/system-flow-diagrams.md](docs/system-flow-diagrams.md)
- [docs/user-facing-flow-diagrams.md](docs/user-facing-flow-diagrams.md)
- [docs/user-flows/README.md](docs/user-flows/README.md)
- [docs/production-rollout.md](docs/production-rollout.md)
- [docs/important-knowledge.md](docs/important-knowledge.md)
