# Forgejo Governance

Read this together with:

- [Development Workflow](./development-workflow.md)
- [Operations](./operations.md)
- [Important Knowledge](./important-knowledge.md)

## Manual Repository Settings

Configure these settings after the repository is moved to Forgejo:

- Protect `main`
- Disable direct push to `main`
- Allow only squash merge into `main`
- Require these checks before merge:
  - `branch-name-check`
  - `changeset-check`
  - `pr-title-lint`
  - `issue-link-check`
  - `ci-check`

## Branch And PR Rules

- Branch format: `<type>/<issue-number>-<slug>`
- PR title format: Conventional Commit, for example `feat(api): add chat persistence`
- PR body must include `Closes #<issue>` or `Refs #<issue>`
- Local authoring helper: `npm run commit`
- Release-worthy PRs must include a changeset file created by `npm run changeset`

## Release Rules

- `feat:` creates a minor release
- `fix:`, `perf:`, and `revert:` create a patch release
- `!` or `BREAKING CHANGE:` creates a major release
- `docs:`, `test:`, `chore:`, `ci:`, `build:`, `ops:`, and `refactor:` do not create a release unless marked breaking

## Version Model

- Product version source of truth is the git tag `vX.Y.Z`
- `packages/release/package.json` is the Changesets working manifest used to prepare the next release
- App and SDK workspace package versions stay at `0.0.0-private`
- Backend runtime version defaults to `dev` locally and must be injected by CI in staging or production
- Frontend build version is exposed through `NEXT_PUBLIC_APP_VERSION`

## Suggested Project Board

Create one product + engineering board with these columns:

- Backlog
- Refined
- Ready
- In Progress
- Review
- Staging
- Done

## Required Secrets

Configure these secrets in Forgejo before enabling the workflows:

- `FORGEJO_TOKEN`
- `FORGEJO_REGISTRY_USER`
- `FORGEJO_REGISTRY_TOKEN`
- `STAGING_SITE_URL`
- `STAGING_API_BASE_URL`
- `STAGING_CORS_ALLOWED_ORIGINS`
- `STAGING_DATABASE_URL`
- `STAGING_REDIS_URL`
- `STAGING_POSTGRES_DB`
- `STAGING_POSTGRES_USER`
- `STAGING_POSTGRES_PASSWORD`
- `STAGING_BACKEND_PORT`
- `STAGING_FRONTEND_PORT`
- `STAGING_HEALTHCHECK_URL`
- `PRODUCTION_SITE_URL`
- `PRODUCTION_API_BASE_URL`
- `PRODUCTION_CORS_ALLOWED_ORIGINS`
- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_REDIS_URL`
- `PRODUCTION_POSTGRES_DB`
- `PRODUCTION_POSTGRES_USER`
- `PRODUCTION_POSTGRES_PASSWORD`
- `PRODUCTION_BACKEND_PORT`
- `PRODUCTION_FRONTEND_PORT`
- `PRODUCTION_HEALTHCHECK_URL`
- `GITHUB_MIRROR_TOKEN`
- `GITHUB_MIRROR_REPOSITORY`

`GITHUB_MIRROR_TOKEN` is also used by `@changesets/changelog-github` to resolve commit and PR metadata for release notes.

## Runner Labels

Provision at least two runner labels:

- `docker` for PR, CI, and release jobs
- `deploy` for image build, push, and compose deployment jobs
