# Operations

This document explains the repository's operational topology: local infrastructure, deploy compose files, image build helpers, and the practical validation boundary before a rollout.

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

Used for local smoke rehearsals, staging, and production rollout:

- `ops/deploy/docker-compose.yml`
- `ops/deploy/local-smoke.env.example`
- `ops/deploy/staging.env.example`
- `ops/deploy/production.env.example`
- `scripts/deploy/check-env.mjs`
- `scripts/deploy/build-images.sh`
- `scripts/deploy/deploy.sh`
- `scripts/deploy/post-deploy-smoke.mjs`

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

This stack exists to support:

- backend runtime compatibility
- Atlas local usage
- local DB-backed feature work
- visual database inspection through pgAdmin at `http://localhost:5050`

It is not the same as the deployment compose stack.

The checked-in compose files mount PostgreSQL data at `/var/lib/postgresql`, which matches the current `postgres:18.1` image default `PGDATA=/var/lib/postgresql/18/docker`.

## 3. Runtime Persistence Boundary

Mutable runtime state now persists in PostgreSQL-backed stores:

- auth sessions and viewer session state
- customer and professional notifications
- consumer preferences
- professional portal resources and runtime state
- admin session, support desk, and admin console tables
- chat threads and messages
- published read-model documents used by the current read-model layer

`apps/backend/seeddata` remains in the repository, but it is now bootstrap import material and test/QA fixtures rather than the live request-time source of truth.

## 4. Deployment Stack

The deploy compose file at `ops/deploy/docker-compose.yml` now expects the same production-significant inputs that the backend and frontend actually need:

- public site and API URLs
- browser CORS origins
- secure auth cookie settings
- auth rate-limit and session TTL values
- admin credential JSON
- image tags and app version metadata
- PostgreSQL and Redis connection details

The compose stack also includes health checks for:

- PostgreSQL
- Redis
- backend `/api/v1/health`
- frontend `/`

The PostgreSQL container is additionally exposed on a loopback-only host port through `POSTGRES_PORT` so Atlas migrations can run safely from the deploy host without publishing the database to the public network.

## 5. Deploy Flow

The intended rollout order is:

1. fill a real env file from the correct template
2. validate it with `node ./scripts/deploy/check-env.mjs`
3. build or pull the intended images
4. apply database migrations before traffic cutover
5. apply Atlas migrations against the loopback-mapped deploy database
6. run `docker compose up -d --remove-orphans`
7. run the post-deploy smoke against the host-mapped ports

The repository helpers are:

```bash
sh ./scripts/deploy/build-images.sh <env-file>
sh ./scripts/deploy/deploy.sh <local|staging|production> <env-file>
node ./scripts/deploy/post-deploy-smoke.mjs <env-file>
```

`deploy.sh` now validates the env file up front, renders `docker compose config`, starts PostgreSQL and Redis first, waits for PostgreSQL health, applies Atlas migrations automatically, starts the app containers, and runs the post-deploy smoke automatically unless `SKIP_DEPLOY_SMOKE=1`.
If you must separate migration from app startup during a controlled rollout, set `SKIP_DEPLOY_MIGRATIONS=1` and run the migration step yourself first.

### Local rehearsal

Use the dedicated local template:

```bash
cp ops/deploy/local-smoke.env.example ops/deploy/local-smoke.env
sh ./scripts/deploy/build-images.sh ops/deploy/local-smoke.env
sh ./scripts/deploy/deploy.sh local ops/deploy/local-smoke.env
```

### Staging or production

Use the corresponding env file only after replacing every placeholder and secret:

```bash
node ./scripts/deploy/check-env.mjs ops/deploy/production.env
sh ./scripts/deploy/build-images.sh ops/deploy/production.env
sh ./scripts/deploy/deploy.sh production ops/deploy/production.env
```

## 6. Database Readiness

Atlas remains the schema source of truth:

- `apps/backend/atlas.hcl`
- `apps/backend/db/schema.sql`
- `apps/backend/db/migrations/*`

Useful commands:

```bash
npm run atlas:status --workspace @bidanapp/backend
npm run atlas:apply --workspace @bidanapp/backend
npm run atlas:migrate:hash --workspace @bidanapp/backend
```

For local QA and deterministic product checks after migrations:

```bash
npm run seed --workspace @bidanapp/backend
npm run smoke:seeded
```

## 7. Validation Boundary

The repository now has three distinct validation layers:

### Code correctness

```bash
npm run ci:check
go test ./...
```

### Seeded runtime functionality

```bash
npm run smoke:seeded
```

### Deploy env and deploy stack sanity

```bash
node ./scripts/deploy/check-env.mjs ops/deploy/local-smoke.env
node ./scripts/deploy/post-deploy-smoke.mjs ops/deploy/local-smoke.env
```

These layers are complementary. Passing one does not replace the others.

## 8. Secrets And Runtime Inputs

Secret categories now include:

- PostgreSQL password or managed database credentials
- Redis credentials if TLS/auth is enabled
- admin bcrypt password hashes
- registry credentials for image pull/push
- deploy host access credentials

General rules:

- secrets belong in host env, secret storage, or CI secrets, never in Git
- `staging` and `production` env templates are examples only, not real deploy-ready files
- validate env files before build and deploy so placeholder values are caught early

## 9. Next Operational Layer

The current repository is operationally ready for Docker-hosted rollout with PostgreSQL and Redis, but a few higher-level platform decisions still sit above the codebase itself:

- external TLS termination and certificate rotation
- backup and restore policy for PostgreSQL and Redis
- centralized log aggregation and alerting
- uptime checks and incident routing
- optional move from published read-model documents to a fuller editorial or CMS workflow
