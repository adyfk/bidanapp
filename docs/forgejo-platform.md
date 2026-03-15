# Forgejo Platform

Read this together with:

- [Operations](./operations.md)
- [Forgejo Governance](./forgejo-governance.md)

This repo includes a lightweight Docker-based platform template under `ops/platform/forgejo`.

## Included Services

- Forgejo `14.0.3`
- Forgejo Runner `12.7.2`
- PostgreSQL `18.1`
- Caddy `2.10.2`
- Docker-in-Docker for runner builds

## Bootstrap

1. Copy the env template:

```bash
cp ops/platform/forgejo/.env.example ops/platform/forgejo/.env
```

2. Start the platform:

```bash
docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env up -d
```

3. Open Forgejo in a browser:

- default local URL: `https://localhost:8443`
- fallback plain HTTP port mapping: `http://localhost:8088`

4. Create the initial admin user using the bootstrap values from the env file:

```bash
set -a
. ./ops/platform/forgejo/.env
set +a

docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env exec forgejo \
  forgejo admin user create \
  --admin \
  --username "$FORGEJO_ADMIN_USERNAME" \
  --password "$FORGEJO_ADMIN_PASSWORD" \
  --email "$FORGEJO_ADMIN_EMAIL"
```

5. Register the runner once on the host:

```bash
set -a
. ./ops/platform/forgejo/.env
set +a
```

```bash
docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env exec runner \
  forgejo-runner register \
  --name "$FORGEJO_RUNNER_NAME" \
  --labels "$FORGEJO_RUNNER_LABELS"
```

Use the repository or organization runner token from Forgejo and assign labels that match the workflows, at minimum `docker` and `deploy`.

6. Start using the repo:

- create repository or import the existing one
- configure branch protection and required checks
- add the required secrets from [Forgejo Governance](./forgejo-governance.md)
- verify the runner shows labels `docker` and `deploy`

## Local-Friendly Defaults

The checked-in env example is intentionally tuned for local use:

- `FORGEJO_DOMAIN=localhost`
- `FORGEJO_ROOT_URL=https://localhost:8443/`
- `FORGEJO_PUBLIC_HTTP_PORT=8088`
- `FORGEJO_PUBLIC_HTTPS_PORT=8443`

That means you can copy the file and boot the stack without first changing the domain.

If you want a real domain later, update at least:

- `FORGEJO_DOMAIN`
- `FORGEJO_ROOT_URL`
- optional host port mappings

## Local Files You Will End Up With

After bootstrap, the platform directory will contain runtime state under:

- `ops/platform/forgejo/data`
- `ops/platform/forgejo/postgres`
- `ops/platform/forgejo/runner`
- `ops/platform/forgejo/caddy`

These should be treated as persistent local runtime data, not source files.

## Common Commands

Start:

```bash
docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env up -d
```

Stop:

```bash
docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env down
```

View logs:

```bash
docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env logs -f forgejo runner caddy
```

Check resolved config:

```bash
docker compose -f ops/platform/forgejo/docker-compose.yml --env-file ops/platform/forgejo/.env config
```

## Notes

- The included runner template assumes Docker socket access via the bundled Docker-in-Docker service.
- The env template now includes admin and runner bootstrap variables so local setup can be copied and run with fewer manual edits.
- `github-mirror` workflow expects a GitHub PAT secret and only mirrors `main` plus release tags.
- `release-main` uses Changesets to version the dedicated `packages/release` workspace, create tag `vX.Y.Z`, and publish the Forgejo release record.
- Production deployment is intentionally `workflow_dispatch` only, which acts as the manual gate before rollout.
