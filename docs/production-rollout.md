# Production Rollout

This runbook is the shortest safe path from a clean main branch to a deployed BidanApp environment.

Use it for:

- a local deployment rehearsal with the production compose topology
- a staging rollout
- a production rollout
- a rollback after a bad release

## 1. Inputs You Must Have

Before you start, prepare:

- a validated env file for the target environment
- image tags for backend and frontend
- database reachability and credentials
- Redis reachability and credentials
- real bcrypt hashes for every admin identity
- the intended `APP_VERSION`
- access to the deploy host or CI runner that will execute Docker commands

For local rehearsal:

- `ops/deploy/local-smoke.env`

For staging or production:

- `ops/deploy/staging.env`
- `ops/deploy/production.env`

## 2. Pre-Deploy Checklist

Run these before touching the target stack:

```bash
npm run ci:check
go test ./...
npm run smoke:seeded
node ./scripts/deploy/check-env.mjs ops/deploy/production.env
npm run atlas:status --workspace @bidanapp/backend
```

Confirm:

- `ci:check` is green
- backend tests are green
- seeded runtime smoke is green
- deploy env validation is green
- Atlas shows no unexpected drift

If the release changes schema, keep in mind that `deploy.sh` now applies Atlas migrations automatically through the loopback-mapped `POSTGRES_PORT` unless you explicitly opt out with `SKIP_DEPLOY_MIGRATIONS=1`.
For a controlled rollout where migrations must happen in a separate step, apply them first:

```bash
npm run atlas:apply --workspace @bidanapp/backend
```

## 3. Build Or Pull Images

If you build locally from the repo:

```bash
sh ./scripts/deploy/build-images.sh ops/deploy/production.env
```

This will:

- validate the env file first
- bake the correct public URLs and frontend runtime flags into the frontend image
- label images with OCI metadata

If your release process pushes images externally, make sure the env file points at the exact tags you intend to deploy.

## 4. Rollout

Deploy with:

```bash
sh ./scripts/deploy/deploy.sh production ops/deploy/production.env
```

This script now:

1. validates the env file
2. renders `docker compose config`
3. pulls images when the target is not `local`
4. starts PostgreSQL and Redis
5. waits for PostgreSQL health and applies Atlas migrations unless `SKIP_DEPLOY_MIGRATIONS=1`
6. starts the full stack with `up -d --remove-orphans`
7. runs the post-deploy smoke unless `SKIP_DEPLOY_SMOKE=1`

For local rehearsal, swap in the local target and env file:

```bash
sh ./scripts/deploy/deploy.sh local ops/deploy/local-smoke.env
```

## 5. Post-Deploy Smoke

The post-deploy smoke script checks the host-mapped frontend and backend ports, not the public DNS entry. That makes it useful even before edge routing is switched over.

Run it manually any time you want:

```bash
node ./scripts/deploy/post-deploy-smoke.mjs ops/deploy/production.env
```

Current checks cover:

- backend `/api/v1/health`
- backend `/api/v1/bootstrap`
- backend professionals list and detail
- backend appointments read-model
- backend viewer session read
- admin guard on `/api/v1/admin/console`
- frontend `/`
- frontend `/id`
- frontend `robots.txt`
- frontend `sitemap.xml`

For deploy hosts that must not auto-migrate, use:

```bash
SKIP_DEPLOY_MIGRATIONS=1 sh ./scripts/deploy/deploy.sh production ops/deploy/production.env
```

## 6. Manual Product Verification

After the deploy smoke is green, do one manual pass on the seeded or real environment for:

- customer login and profile save
- professional login and portal load
- admin login and support desk load
- a public professional detail page
- one chat thread load

For local or staging rehearsal, seed first if you want deterministic data:

```bash
npm run seed --workspace @bidanapp/backend
npm run smoke:seeded
```

## 7. Rollback

If the release is unhealthy:

1. point `BACKEND_IMAGE` and `FRONTEND_IMAGE` back to the previous known-good tags
2. keep the same env file unless a config change caused the problem
3. redeploy:

```bash
sh ./scripts/deploy/deploy.sh production ops/deploy/production.env
```

4. rerun the post-deploy smoke

If the failure is schema-related, stop and assess compatibility before rolling back app containers over a forward-only migration.

## 8. Secrets And Safety Rules

Never commit:

- real `ops/deploy/*.env` files
- real database passwords
- real Redis credentials
- real admin password hashes unless they are intentionally managed outside the repo

Always verify in staging or production:

- `PUBLIC_SITE_URL` and `PUBLIC_API_BASE_URL` use `https://`
- `CORS_ALLOWED_ORIGINS` matches the real frontend origin
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_DOMAIN` matches the intended domain scope
- `ADMIN_CONSOLE_CREDENTIALS_JSON` contains real bcrypt hashes, not placeholders

## 9. What This Runbook Does Not Replace

This runbook covers repository-owned rollout steps. It does not replace:

- edge TLS and certificate management
- host hardening
- backup and restore drills
- off-host log aggregation
- metrics, alerting, and incident routing

Those still need to exist around this application before you call the whole system fully production-operated.
