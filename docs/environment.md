# Environment Setup

Use this together with:

- [Getting Started](./getting-started.md)
- [Operations](./operations.md)
- [Production Rollout](./production-rollout.md)

This monorepo uses app-scoped environment files so frontend and backend can evolve independently without leaking unrelated variables across services.

## Files To Create

- `apps/frontend/.env.local`
- `apps/backend/.env`
- `ops/deploy/local-smoke.env`
- `ops/deploy/staging.env`
- `ops/deploy/production.env`

Start by copying the checked-in examples:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
cp ops/deploy/local-smoke.env.example ops/deploy/local-smoke.env
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
| `AUTH_COOKIE_DOMAIN` | Yes | Shared session cookie domain, or empty for host-only cookies | `` |
| `AUTH_COOKIE_PATH` | Yes | Session cookie path | `/api/v1` |
| `AUTH_COOKIE_SECURE` | Yes | Whether auth cookies require HTTPS | `false` in development, `true` in staging/production by default |
| `AUTH_COOKIE_SAME_SITE` | Yes | Session cookie SameSite policy: `lax`, `strict`, or `none` | `lax` |
| `ADMIN_AUTH_COOKIE_NAME` | Yes | Admin session cookie name | `bidanapp_admin_session` |
| `CUSTOMER_AUTH_COOKIE_NAME` | Yes | Customer session cookie name | `bidanapp_customer_session` |
| `PROFESSIONAL_AUTH_COOKIE_NAME` | Yes | Professional session cookie name | `bidanapp_professional_session` |
| `SEED_DATA_DIR` | Yes | Path to backend-owned normalized JSON seed tables | `./seeddata` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL | `postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable` |
| `REDIS_URL` | Yes | Redis connection URL | `redis://localhost:6379` |
| `LOG_LEVEL` | Yes | Log verbosity: `debug`, `info`, `warn`, `error` | `debug` |
| `LOG_FORMAT` | Yes | Log encoding: `text` or `json` | `text` |

Notes:

- Backend config is fail-fast. Invalid URLs, invalid ports, missing seed data, and unsupported enum values stop boot immediately.
- Backend loads `apps/backend/.env`, `apps/backend/.env.local`, plus environment-specific files such as `apps/backend/.env.production`.
- In staging and production, `APP_VERSION` and `NEXT_PUBLIC_APP_VERSION` should be injected by CI/CD from the release tag or deployment metadata.
- In staging and production, `CORS_ALLOWED_ORIGINS` must use `https://` origins and auth cookies must remain `Secure=true`.
- Cookie-authenticated unsafe requests are origin-checked. Browser clients should send the normal `Origin` header, while non-browser API clients should prefer explicit `Authorization: Bearer ...` tokens.

## Deploy Compose Templates

The repository includes three deployment env templates:

- `ops/deploy/local-smoke.env.example`
- `ops/deploy/staging.env.example`
- `ops/deploy/production.env.example`

Use them for different jobs:

- `local-smoke`
  local Docker validation on one workstation with `http://localhost` values
- `staging`
  a production-like staging rollout with `https://` public origins and secure cookies
- `production`
  the real production rollout template with secure cookie and domain placeholders

`staging` and `production` examples are intentionally placeholder-heavy and should fail validation until real values are filled in.

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
| `NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE` | Yes | Frontend portal data source for the built image | `api` |
| `NEXT_PUBLIC_APP_STATE_DATA_SOURCE` | Yes | Frontend app-state data source for the built image | `api` |
| `NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED` | Yes | Whether the admin console routes should be reachable in the built image | `true` |
| `POSTGRES_DB` | Yes | Postgres database name | `bidanapp_staging` |
| `POSTGRES_PORT` | Yes | Host loopback port temporarily exposed for Atlas deploy migrations | `25432` |
| `POSTGRES_USER` | Yes | Postgres username | `postgres` |
| `POSTGRES_PASSWORD` | Yes | Postgres password | `change-me` |
| `DATABASE_URL` | Yes | Backend PostgreSQL connection URL | `postgres://postgres:change-me@postgres:5432/bidanapp_staging?sslmode=disable` |
| `REDIS_URL` | Yes | Backend Redis connection URL | `redis://redis:6379` |
| `CORS_ALLOWED_ORIGINS` | Yes | Backend browser origins | `http://localhost:13000` |
| `AUTH_COOKIE_DOMAIN` | Yes in staging/production | Shared cookie domain for admin, customer, and professional sessions | `.bidanapp.id` |
| `AUTH_COOKIE_PATH` | Yes | Auth cookie path | `/api/v1` |
| `AUTH_COOKIE_SECURE` | Yes | Whether auth cookies require HTTPS | `true` in staging/production |
| `AUTH_COOKIE_SAME_SITE` | Yes | Auth cookie SameSite policy | `lax` |
| `ADMIN_AUTH_COOKIE_NAME` | Yes | Admin auth cookie name | `bidanapp_admin_session` |
| `CUSTOMER_AUTH_COOKIE_NAME` | Yes | Customer auth cookie name | `bidanapp_customer_session` |
| `PROFESSIONAL_AUTH_COOKIE_NAME` | Yes | Professional auth cookie name | `bidanapp_professional_session` |
| `AUTH_RATE_LIMIT_WINDOW` | Yes | Auth limiter time window | `5m` |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | Yes | Max auth attempts per window | `10` |
| `ADMIN_AUTH_SESSION_TTL` | Yes | Admin session TTL | `24h` |
| `CUSTOMER_AUTH_SESSION_TTL` | Yes | Customer session TTL | `24h` |
| `PROFESSIONAL_AUTH_SESSION_TTL` | Yes | Professional session TTL | `24h` |
| `ADMIN_CONSOLE_CREDENTIALS_JSON` | Yes in staging/production | JSON array of admin identities and bcrypt password hashes | see env example |
| `LOG_LEVEL` | Yes | Backend log verbosity | `info` |
| `LOG_FORMAT` | Yes | Backend log format | `json` |

Validation before build or deploy:

```bash
node ./scripts/deploy/check-env.mjs ops/deploy/local-smoke.env
```

### Manual local deploy flow

After copying `ops/deploy/local-smoke.env.example`:

```bash
sh ./scripts/deploy/build-images.sh ops/deploy/local-smoke.env
sh ./scripts/deploy/deploy.sh local ops/deploy/local-smoke.env
```

This runs a post-deploy smoke by default against the host-mapped frontend and backend ports. To skip that final smoke on purpose, set `SKIP_DEPLOY_SMOKE=1`.
`deploy.sh` also applies Atlas migrations automatically through the loopback-mapped `POSTGRES_PORT` unless `SKIP_DEPLOY_MIGRATIONS=1` is set for a controlled rollout.

For staging and production, use the same commands with the respective env file after all placeholders and secrets are replaced.

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
