# Environment Setup

Use this together with:

- [Getting Started](./getting-started.md)
- [Operations](./operations.md)

This monorepo uses app-scoped environment files so frontend and backend can evolve independently without leaking unrelated variables across services.

## Files To Create

- `apps/frontend/.env.local`
- `apps/backend/.env`
- `ops/deploy/staging.env`
- `ops/deploy/production.env`

Start by copying the checked-in examples:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
cp ops/deploy/staging.env.example ops/deploy/staging.env
cp ops/deploy/production.env.example ops/deploy/production.env
```

## Frontend Variables

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_VERSION` | Yes | Frontend build version surfaced for deploy traceability | `dev` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public site URL used for metadata, sitemap, and robots | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public API base URL for frontend-to-backend integration | `http://localhost:8080/api/v1` |

Notes:

- Values must be absolute URLs.
- Frontend env values are public by design. Do not store secrets in `NEXT_PUBLIC_*`.

## Backend Variables

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `APP_NAME` | Yes | Service name surfaced in logs and health responses | `bidanapp-backend` |
| `APP_VERSION` | Yes | Version string surfaced in logs and health responses | `dev` |
| `APP_ENV` | Yes | Runtime mode: `development`, `staging`, `production`, `test` | `development` |
| `HTTP_HOST` | Yes | Bind address | `0.0.0.0` |
| `HTTP_PORT` | Yes | API port | `8080` |
| `HTTP_READ_HEADER_TIMEOUT` | Yes | Header read timeout | `5s` |
| `HTTP_READ_TIMEOUT` | Yes | Full request read timeout | `10s` |
| `HTTP_WRITE_TIMEOUT` | Yes | Response write timeout | `30s` |
| `HTTP_IDLE_TIMEOUT` | Yes | Keep-alive timeout | `60s` |
| `HTTP_SHUTDOWN_TIMEOUT` | Yes | Graceful shutdown timeout | `10s` |
| `HTTP_MAX_HEADER_BYTES` | Yes | Header size limit | `1048576` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed browser origins | `http://localhost:3000` |
| `SIMULATION_DATA_DIR` | Yes | Path to CMS-like JSON simulation dataset | `../frontend/src/data/simulation` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL | `postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable` |
| `REDIS_URL` | Yes | Redis connection URL | `redis://localhost:6379` |
| `LOG_LEVEL` | Yes | Log verbosity: `debug`, `info`, `warn`, `error` | `debug` |
| `LOG_FORMAT` | Yes | Log encoding: `text` or `json` | `text` |

Notes:

- Backend config is fail-fast. Invalid URLs, invalid ports, missing simulation data, and unsupported enum values stop boot immediately.
- Backend loads `apps/backend/.env`, `apps/backend/.env.local`, plus environment-specific files such as `apps/backend/.env.production`.
- In staging and production, `APP_VERSION` and `NEXT_PUBLIC_APP_VERSION` should be injected by CI/CD from the release tag or deployment metadata.

## Deploy Compose Templates

The repository includes two deployment env templates:

- `ops/deploy/staging.env.example`
- `ops/deploy/production.env.example`

These templates are local-friendly by default so you can copy them and use them for manual Docker deployment smoke tests.

### Shared deploy variables

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Yes | Docker Compose project name | `bidanapp-staging` |
| `APP_ENV` | Yes | Backend runtime mode | `staging` |
| `APP_VERSION` | Yes | Runtime and image version metadata | `main-local` |
| `BACKEND_IMAGE` | Yes | Backend image tag to run | `bidanapp-backend:local` |
| `FRONTEND_IMAGE` | Yes | Frontend image tag to run | `bidanapp-frontend:local` |
| `BACKEND_PORT` | Yes | Host port mapped to backend container port `8080` | `18080` |
| `FRONTEND_PORT` | Yes | Host port mapped to frontend container port `3000` | `13000` |
| `PUBLIC_SITE_URL` | Yes for local image build helper | Public site URL baked into the frontend image | `http://localhost:13000` |
| `PUBLIC_API_BASE_URL` | Yes for local image build helper | Public API base URL baked into the frontend image | `http://localhost:18080/api/v1` |
| `POSTGRES_DB` | Yes | Postgres database name | `bidanapp_staging` |
| `POSTGRES_USER` | Yes | Postgres username | `postgres` |
| `POSTGRES_PASSWORD` | Yes | Postgres password | `change-me` |
| `DATABASE_URL` | Yes | Backend PostgreSQL connection URL | `postgres://postgres:change-me@postgres:5432/bidanapp_staging?sslmode=disable` |
| `REDIS_URL` | Yes | Backend Redis connection URL | `redis://redis:6379` |
| `CORS_ALLOWED_ORIGINS` | Yes | Backend browser origins | `http://localhost:13000` |
| `LOG_LEVEL` | Yes | Backend log verbosity | `info` |
| `LOG_FORMAT` | Yes | Backend log format | `json` |

### Manual local deploy flow

After copying one of the deploy env templates:

```bash
sh ./scripts/deploy/build-images.sh ops/deploy/staging.env
sh ./scripts/deploy/deploy.sh staging ops/deploy/staging.env
```

## Recommended Workflow

```bash
npm install
make doctor
make dev
```

Optional infrastructure:

```bash
make infra-up
```

## Security Defaults

- Backend adds `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Frontend disables the `X-Powered-By` header and serves the same defensive browser headers.
- CORS is explicit and environment-driven instead of open by default.
