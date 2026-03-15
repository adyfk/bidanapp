# BidanApp Monorepo

This repository uses a monorepo layout with a Next.js frontend and a Go backend:

```text
.
├── apps
│   ├── frontend   # Next.js 16 app
│   └── backend    # Go 1.26 API service
├── docs
└── docker-compose.dev.yml
```

## Apps

- `apps/frontend`
  Consumer-facing web app built with Next.js, React 19, and `next-intl`
- `apps/backend`
  Go API scaffold with standard-library HTTP, feature modules, middleware, graceful shutdown, and simulation-data endpoints

## Monorepo Tooling

- `npm workspaces` for app packaging
- `turbo` for root orchestration
- Go scripts wrapped in `apps/backend/package.json` so frontend and backend can be run from one root workflow
- `.editorconfig`, `.nvmrc`, and a root `Makefile` for consistent local setup

## Requirements

- Node.js `24.12.0+`
- npm `11.6.2+`
- Go `1.26.x`
- Docker Desktop or Docker Engine for optional local infra

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local env files:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

3. Start frontend and backend together:

```bash
npm run dev
```

4. Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080/api/v1/health`

Detailed variable reference lives in [docs/environment.md](docs/environment.md).

## Root Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run typecheck
npm run check
npm run doctor
npm run clean
```

Target one app when needed:

```bash
npm run dev:frontend
npm run dev:backend
npm run start:frontend
npm run start:backend
```

Equivalent `make` targets are available:

```bash
make dev
make check
make infra-up
```

## Local Infrastructure

Optional local services:

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

The backend is already aligned with these defaults via `apps/backend/.env.example`.

## Backend Architecture

The backend is structured to scale into full feature development without forcing a heavy framework:

```text
apps/backend
├── cmd/api                    # process entrypoint
├── internal/config            # env-driven configuration
├── internal/http              # router and middleware composition
├── internal/modules           # vertical feature slices
│   ├── health
│   └── simulation
├── internal/platform          # shared platform concerns
│   ├── log
│   └── web
└── internal/server            # HTTP server lifecycle
```

Current API endpoints:

- `GET /api/v1/health`
- `GET /api/v1/settings`
- `GET /api/v1/catalog`
- `GET /api/v1/professionals`
- `GET /api/v1/professionals/{slug}`
- `GET /api/v1/appointments`
- `GET /api/v1/chat`

These endpoints read the same simulation JSON currently used by the frontend, which makes it easy to iterate on UI and backend contracts in parallel before moving domains to persistent storage.

## Environment And Security

- Frontend public env is validated before use and normalized into typed runtime config.
- Backend config is fail-fast, validated, and supports app-scoped `.env` files.
- Backend server timeouts, max header bytes, CORS origins, log level, and log format are environment-driven.
- Frontend and backend both ship defensive browser headers by default.

## Frontend Notes

- Frontend env example: `apps/frontend/.env.example`
- Frontend simulation and app settings now live under `apps/frontend/src`

The frontend still works with its current simulation contract today, but the monorepo split makes it straightforward to migrate screen-by-screen toward live backend data.
