# BidanApp Documentation

This directory is the main engineering handbook for the repository. It explains how the monorepo is structured, how frontend and backend align, how local development works, and how validation and deployment are handled without bundling a self-hosted Git platform stack.

## Recommended Reading Order

If you are new to the repository, read these documents in order:

1. [Getting Started](./getting-started.md)
2. [Architecture](./architecture.md)
3. [Frontend Guide](./frontend.md) or [Backend Guide](./backend.md)
4. [SDK And API Contract](./sdk.md)
5. [Development Workflow](./development-workflow.md)
6. [Operations](./operations.md)
7. [Important Knowledge](./important-knowledge.md)

## Documentation Map

### Core handbook

- [Getting Started](./getting-started.md)
  First-time setup, environment files, local commands, URLs, and troubleshooting.
- [Architecture](./architecture.md)
  Monorepo boundaries, runtime flow, contract flow, realtime flow, and current system state.
- [Frontend Guide](./frontend.md)
  Next.js route layout, locale handling, screen decomposition, mock-db data, and frontend testing.
- [Backend Guide](./backend.md)
  Go service boot flow, module structure, Huma contract generation, websocket chat, Atlas readiness, and backend testing.
- [SDK And API Contract](./sdk.md)
  How `@bidanapp/sdk` works, why it exists, what is generated, and how FE consumes backend contracts safely.
- [Development Workflow](./development-workflow.md)
  Issue-first work, branch naming, Conventional Commits, Changesets, PR rules, release flow, and required local checks.
- [Operations](./operations.md)
  Docker, local infra, deploy compose, release metadata, and deploy jobs.
- [Important Knowledge](./important-knowledge.md)
  High-signal rules, common mistakes, non-obvious decisions, and future work boundaries.

### Supporting references

- [Environment Setup](./environment.md)
  Detailed environment variable reference for frontend, backend, and deploy templates.
- [API Contract Alignment](./api-contract.md)
  Concise explanation of backend-generated OpenAPI and generated TypeScript types.
- [Mock DB Contract](./mock-db-contract.md)
  Shape and ownership of the normalized JSON table set used as dummy domain data before PostgreSQL.
- [Mock DB Blueprint](./mock-db/README.md)
  Entity, flow, state, and manifest reference for the normalized dummy table set.

## Who Should Read What

### Frontend engineer

Start with:

1. [Getting Started](./getting-started.md)
2. [Architecture](./architecture.md)
3. [Frontend Guide](./frontend.md)
4. [SDK And API Contract](./sdk.md)
5. [Important Knowledge](./important-knowledge.md)

### Backend engineer

Start with:

1. [Getting Started](./getting-started.md)
2. [Architecture](./architecture.md)
3. [Backend Guide](./backend.md)
4. [SDK And API Contract](./sdk.md)
5. [Important Knowledge](./important-knowledge.md)

### Infra or release owner

Start with:

1. [Development Workflow](./development-workflow.md)
2. [Operations](./operations.md)
3. [Environment Setup](./environment.md)

## Core Principles In This Repository

- Backend owns the public API contract.
- Frontend should consume backend transport through `@bidanapp/sdk`, not raw fetch calls spread across screens.
- OpenAPI is generated from backend code, never hand-written as the primary source.
- Websocket handshake belongs in OpenAPI; websocket frame types belong in the SDK.
- Route building should stay aligned with `@/i18n/routing` and route helpers, not hardcoded localized strings.
- Local preflight is the default gate. External CI can be attached later, but it should reuse the same repository commands.
- The current system is intentionally in transition from mock-db seed tables toward persistent storage. Documentation should state that clearly instead of pretending the migration is complete.

## How To Maintain These Docs

- Update the relevant handbook page whenever behavior, commands, or file ownership changes.
- If a new subsystem is introduced, add it to [Architecture](./architecture.md) and to this index.
- If a change affects onboarding, update [Getting Started](./getting-started.md).
- If a change affects PR, release, or deploy flow, update [Development Workflow](./development-workflow.md) and [Operations](./operations.md).
- If a change alters environment variables, update [Environment Setup](./environment.md).
- If a change alters response or event contracts, update [SDK And API Contract](./sdk.md) and supporting contract docs.
