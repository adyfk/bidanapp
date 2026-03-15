# Environment Setup

This monorepo uses app-scoped environment files so frontend and backend can evolve independently without leaking unrelated variables across services.

## Files To Create

- `apps/frontend/.env.local`
- `apps/backend/.env`

Start by copying the checked-in examples:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

## Frontend Variables

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public site URL used for metadata, sitemap, and robots | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public API base URL for frontend-to-backend integration | `http://localhost:8080/api/v1` |

Notes:

- Values must be absolute URLs.
- Frontend env values are public by design. Do not store secrets in `NEXT_PUBLIC_*`.

## Backend Variables

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `APP_NAME` | Yes | Service name surfaced in logs and health responses | `bidanapp-backend` |
| `APP_VERSION` | Yes | Version string surfaced in logs and health responses | `0.1.0` |
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
