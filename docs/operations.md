# Operations

This document explains the operational pieces of the repository: local Docker services, deployment compose files, build metadata, and the current manual deploy model.

## 1. Operational Layers

There are two operational scopes in the repository:

### Local development infra

Used by developers on a workstation:

- `docker-compose.dev.yml`

Services:

- PostgreSQL
- Redis
- pgAdmin

### Application deployment stack

Used by staging and production rollout:

- `ops/deploy/docker-compose.yml`
- `ops/deploy/staging.env.example`
- `ops/deploy/production.env.example`
- `scripts/deploy/build-images.sh`
- `scripts/deploy/deploy.sh`

Services:

- PostgreSQL
- Redis
- backend app container
- frontend app container

## 2. Local Development Infra

Start local PostgreSQL and Redis:

```bash
npm run infra:up
```

Stop them:

```bash
npm run infra:down
```

This stack is intentionally small. It exists to support:

- backend environment compatibility
- Atlas local usage
- future DB-backed feature development
- visual database inspection through pgAdmin at `http://localhost:5050`

It is not the same as the deployment compose stack.

PostgreSQL `18+` now expects the primary volume mount at `/var/lib/postgresql`. The compose files in this repository already follow that layout.

## 3. Backend Database Readiness

Atlas configuration lives in:

- `apps/backend/atlas.hcl`
- `apps/backend/db/schema.sql`
- `apps/backend/db/migrations/*`

Today the main persistence preparation is for chat:

- `chat_threads`
- `chat_messages`

Runtime note:

- the production-ready schema direction exists
- the live websocket hub still uses in-memory storage

## 4. Deployment Stack

The deploy compose file at `ops/deploy/docker-compose.yml` expects environment variables for:

- app version
- image names
- ports
- PostgreSQL credentials
- database URL
- Redis URL
- CORS origins
- log level and log format

Deployment flow is intentionally simple:

1. pull images
2. run `docker compose up -d --remove-orphans`

The helper script is:

```bash
sh ./scripts/deploy/deploy.sh <staging|production> <env-file>
```

There is also a local build helper that reads the same env file:

```bash
sh ./scripts/deploy/build-images.sh <env-file>
```

### Local manual staging smoke deploy

This is the shortest local Docker flow using the checked-in env templates:

```bash
cp ops/deploy/staging.env.example ops/deploy/staging.env
sh ./scripts/deploy/build-images.sh ops/deploy/staging.env
sh ./scripts/deploy/deploy.sh staging ops/deploy/staging.env
```

Then open:

- frontend: `http://localhost:13000`
- backend health: `http://localhost:18080/api/v1/health`
- backend docs: `http://localhost:18080/api/v1/docs`

The same pattern works for `production.env`, only with different ports.

## 4.1 Which Services Have A UI

Not every container is supposed to be opened in a browser.

### Local development stack

- `postgres`
  No built-in UI.
- `redis`
  No built-in UI.
- `pgadmin`
  Yes. This is the browser UI for the local development PostgreSQL service.
  Open `http://localhost:5050`.

## 5. Docker Image Model

Both backend and frontend have Dockerfiles:

- `apps/backend/Dockerfile`
- `apps/frontend/Dockerfile`

Build metadata is exported by:

- `scripts/release/export-build-metadata.cjs`

This script produces:

- `APP_VERSION`
- `IMAGE_TAG`
- `OCI_CREATED`
- `OCI_REVISION`
- `OCI_SOURCE`
- `OCI_VERSION`

The Dockerfiles apply OCI labels so deployed images are traceable to:

- version
- commit SHA
- source repository
- build timestamp

## 6. Validation And Release Boundary

This repository keeps validation and release rules in repository-local commands instead of coupling them to one Git platform.

The canonical preflight is:

```bash
npm run ci:check
```

Useful narrower commands:

```bash
npm run branch:lint
npm run pr:title:lint
npm run pr:body:lint
npm run changeset:check
npm run release:dry-run
```

If external CI/CD is attached later, it should call the same commands instead of inventing a second source of truth.

## 7. Secrets And Runtime Inputs

Current secret categories:

- deploy host access
- deploy image registry auth
- release publishing tokens if a release provider is used later

General rule:

- secrets belong in the host environment or external CI secret storage, never in the repository

## 8. Operational Boundaries

- `docker-compose.dev.yml` is only for local developer infrastructure.
- `ops/deploy/docker-compose.yml` is for app deployment topology.
- repository collaboration tooling is intentionally kept outside this repository.
- Atlas describes schema intent, but current chat runtime still does not persist messages.
- A release tag and runtime `APP_VERSION` are the deployment identity, not the application package versions.
