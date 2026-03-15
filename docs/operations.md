# Operations

This document explains the operational pieces of the repository: local Docker services, deployment compose files, Forgejo platform setup, release jobs, deploy jobs, and the current secret model.

## 1. Operational Layers

There are three different operational scopes in the repository:

### Local development infra

Used by developers on a workstation:

- `docker-compose.dev.yml`

Services:

- PostgreSQL
- Redis

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

### Self-hosted platform stack

Used to run the repository platform itself:

- `ops/platform/forgejo/docker-compose.yml`
- `ops/platform/forgejo/.env.example`
- `ops/platform/forgejo/Caddyfile`

Services:

- Forgejo
- Forgejo runner
- PostgreSQL for Forgejo
- Caddy
- Docker-in-Docker for runner builds

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

It is not the same as the deployment compose stack.

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

## 6. Forgejo Workflows

The repository includes these workflow templates:

- `.forgejo/workflows/pr-governance.yml`
- `.forgejo/workflows/ci-check.yml`
- `.forgejo/workflows/release-main.yml`
- `.forgejo/workflows/deploy-staging.yml`
- `.forgejo/workflows/deploy-production.yml`
- `.forgejo/workflows/github-mirror.yml`

### `pr-governance`

Runs on pull request events and checks:

- PR title format
- PR body issue reference
- branch naming
- changeset requirement

### `ci-check`

Runs on pull requests and pushes to `main`.

It executes:

- `npm ci`
- Node and Go setup
- `npm run ci:check`

### `release-main`

Runs on pushes to `main`.

It:

- installs dependencies
- configures git identity
- runs `npm run release:ci`
- creates the release commit and tag
- publishes a Forgejo release record

### `deploy-staging`

Runs on pushes to `main` and can also be triggered manually.

It:

- calculates build metadata
- logs into the Forgejo registry
- builds backend and frontend images
- pushes those images
- writes a staging env file at runtime
- deploys through the compose helper
- runs a healthcheck URL

### `deploy-production`

Runs only by manual dispatch.

It:

- checks out a specific release tag
- builds versioned images
- writes a production env file at runtime
- deploys through the compose helper
- runs a production healthcheck URL

This is the manual release gate before production rollout.

### `github-mirror`

Mirrors `main` and release tags to GitHub.

The intended operating model is:

- Forgejo is the main engineering system
- GitHub is a mirror and optional public presence

## 7. Secrets And Configuration

Exact secret names are documented in [Forgejo Governance](./forgejo-governance.md).

They cover:

- Forgejo release publishing
- registry authentication
- staging deploy variables
- production deploy variables
- GitHub mirror access

Important operational rule:

- secrets belong in Forgejo or host environment, never in the repository

## 8. Forgejo Platform Bootstrap

The platform template is intentionally Docker-based and lightweight.

Basic bootstrap:

1. copy `ops/platform/forgejo/.env.example` to `.env`
2. start the stack with docker compose
3. create the initial admin user
4. register the runner
5. assign the expected labels, at minimum `docker` and `deploy`
6. configure branch protection and required checks manually in Forgejo

See [Forgejo Platform](./forgejo-platform.md) for the bootstrap summary and [Forgejo Governance](./forgejo-governance.md) for the required repo settings.

## 9. Recommended Operational Practices

These are not fully automated by the repo, but should be treated as standard:

- back up Forgejo PostgreSQL and repository storage
- back up deployment env files and host-level secret configuration
- rotate tokens used for registry and mirror integration
- monitor staging and production healthcheck endpoints after deployment
- keep Docker host disk usage under control because image builds and registry use can grow quickly

## 10. Common Mistakes To Avoid

- confusing local dev infra with the real deploy compose stack
- assuming the deploy workflow manages secrets automatically
- deploying production from `main` HEAD without an explicit release tag
- treating GitHub as the primary governance source once Forgejo is adopted
- forgetting to set runner labels that match workflow expectations
