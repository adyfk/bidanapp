# Getting Started

This guide explains how to run the repository locally, what the minimum setup is, which commands matter most, and what you should verify before starting feature work.

## 1. What You Are Running

The repository contains:

- a Next.js frontend in `apps/frontend`
- a Go backend in `apps/backend`
- a shared integration package in `packages/sdk`
- a release manifest package in `packages/release`
- optional local infrastructure through Docker
- optional app deployment templates through Docker Compose

You do not need any self-hosted Git platform stack to start feature development. For most product work, the minimal requirement is Node, npm, Go, and the two app env files.

## 2. Required Tool Versions

Use at least these versions:

- Node.js `24.12.0`
- npm `11.6.2`
- Go `1.26.x`
- Docker Engine or Docker Desktop if you need PostgreSQL, Redis, Atlas, or deployment stack validation

Useful local consistency files already exist:

- `.nvmrc`
- `.editorconfig`
- `Makefile`

## 3. First-Time Setup

### Install dependencies

```bash
npm install
```

### Create environment files

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

The current defaults are suitable for local development:

- frontend public site URL: `http://localhost:3000`
- frontend public API base URL: `http://localhost:8080/api/v1`
- backend port: `8080`
- backend CORS origin: `http://localhost:3000`
- backend simulation data dir: `../frontend/src/data/simulation`
- PostgreSQL URL: `postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable`
- Redis URL: `redis://localhost:6379`

The backend validates these values at boot. If an env value is malformed, the process exits immediately.

## 4. Running The App

### Run frontend and backend together

```bash
npm run dev
```

### Run a single app

Frontend only:

```bash
npm run dev:frontend
```

Backend only:

```bash
npm run dev:backend
```

### Run optional local infra

```bash
npm run infra:up
```

This starts:

- PostgreSQL `18.1` on `localhost:5432`
- Redis `8.6.1` on `localhost:6379`

Stop it with:

```bash
npm run infra:down
```

### Use Atlas locally

Bring up PostgreSQL if it is not running yet:

```bash
npm run db:up --workspace @bidanapp/backend
```

Inspect migration status:

```bash
npm run atlas:status --workspace @bidanapp/backend
```

Apply migrations:

```bash
npm run atlas:apply --workspace @bidanapp/backend
```

## 5. Local URLs To Verify

After `npm run dev`, confirm these routes:

- frontend root: `http://localhost:3000`
- localized frontend root: `http://localhost:3000/id`
- backend health: `http://localhost:8080/api/v1/health`
- backend docs: `http://localhost:8080/api/v1/docs`
- backend OpenAPI JSON: `http://localhost:8080/api/v1/openapi.json`
- integration example: `http://localhost:3000/id/examples/backend`

The integration example is useful because it exercises:

- typed REST calls through `@bidanapp/sdk`
- backend health and professionals endpoints
- websocket chat handshake and event flow
- frontend runtime version display

## 6. Root Commands You Will Use Often

### Development and validation

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run test
npm run typecheck
npm run check
npm run ci:check
```

### Contract and release workflow

```bash
npm run contract:generate
npm run generated:check
npm run commit
npm run changeset
npm run changeset:status
npm run release:dry-run
```

### Health checks for your environment

```bash
npm run doctor
make doctor
```

## 7. Daily Development Flow

The expected daily loop is:

1. Pull the latest `main`.
2. Create or confirm the issue that tracks the work.
3. Create a branch with the required format:

```text
<type>/<issue-number>-<slug>
```

Example:

```text
feat/128-chat-persistence
```

4. Start the apps you need.
5. Make the change in the right layer.
6. Run relevant checks locally.
7. If the change is release-worthy, add a changeset:

```bash
npm run changeset
```

8. Open a PR with a Conventional Commit title.
9. Merge with squash only after checks pass.

See [Development Workflow](./development-workflow.md) for the full governance rules.

## 8. What You Should Read Next

- For repo design and system boundaries, read [Architecture](./architecture.md).
- For frontend work, read [Frontend Guide](./frontend.md).
- For backend work, read [Backend Guide](./backend.md).
- For FE/BE alignment, read [SDK And API Contract](./sdk.md).
- For environment details, read [Environment Setup](./environment.md).

## 9. Common First-Day Tasks

### I only need UI work

- Run `npm install`.
- Copy env files.
- Run `npm run dev`.
- Work primarily in `apps/frontend`.
- Read [Frontend Guide](./frontend.md).

You usually do not need PostgreSQL or Redis yet because most current business data is still simulation-backed.

### I need API contract changes

- Run `npm install`.
- Copy env files.
- Run `npm run dev:backend`.
- Change the backend route, DTO, or module.
- Run `npm run contract:generate`.
- Update frontend or SDK consumers as needed.

### I need database work

- Start local PostgreSQL with `npm run infra:up` or `npm run db:up --workspace @bidanapp/backend`.
- Read `apps/backend/atlas.hcl`, `apps/backend/db/schema.sql`, and [Backend Guide](./backend.md).
- Keep Atlas schema, migrations, and backend behavior aligned.

## 10. Troubleshooting

### Backend fails on boot because of config

The backend is fail-fast. Common causes:

- invalid URL in `DATABASE_URL`
- invalid URL in `REDIS_URL`
- invalid `CORS_ALLOWED_ORIGINS`
- non-existent `SIMULATION_DATA_DIR`
- unsupported `APP_ENV`, `LOG_LEVEL`, or `LOG_FORMAT`

Check [Environment Setup](./environment.md) and verify the env files you copied.
