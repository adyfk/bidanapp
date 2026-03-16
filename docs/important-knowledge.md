# Important Knowledge

This document collects the non-obvious facts and rules that are easy to miss when you only look at one part of the codebase.

## 1. The Repository Is In A Transitional State

The codebase is intentionally between two phases:

- current product development still leans on mock-db seed data
- future product development is moving toward backend-owned contracts and real persistence

Do not document or design features as if the migration is already complete.

## 2. Frontend And Backend Currently Share Mock DB Data

This is one of the most important facts in the repo.

Today:

- frontend reads normalized mock-db JSON tables for many product flows
- backend reads the same mock-db dataset for its demo and contract endpoints

This is useful because:

- frontend and backend can iterate on the same domain model
- contract work can progress before persistence is fully implemented

This is dangerous if misunderstood because:

- a backend endpoint returning mock-db-backed data is not the same thing as a production persistence layer

## 3. Backend Owns REST Contract Truth

REST contracts are defined in backend code through Huma.

That means:

- OpenAPI should not be hand-authored as the primary source
- generated artifacts in `packages/sdk` should not be manually edited
- if backend request or response shape changes, regenerate the SDK

Quick rule:

- backend first
- generate contract
- then update frontend

## 4. Websocket Contracts Are Split On Purpose

The websocket endpoint is documented in OpenAPI, but websocket frame types live in the SDK.

That is not accidental.

The design is:

- OpenAPI documents the handshake endpoint and query parameters
- `@bidanapp/sdk` documents event payload types used by the frontend

Do not try to force the entire realtime protocol into raw REST-oriented OpenAPI structures.

## 5. `@bidanapp/sdk` Is The FE/BE Boundary

When frontend code needs backend data:

- prefer `@bidanapp/sdk`
- prefer one adapter per shared normalization need
- avoid spreading raw `fetch()` usage across screen components

Good layering:

```text
screen
  -> hook or action handler
  -> sdk client or adapter
  -> backend
```

## 6. Locale Routing Must Stay Centralized

This repository intentionally standardized navigation through:

- `@/i18n/routing`
- `@/lib/routes.ts`

If you add routes or links:

- keep them locale-safe
- test both `/id/*` and `/en/*`
- avoid hardcoded strings when helpers already exist

## 7. Screen Decomposition Is A Repository Convention

Large screens should be broken into:

- screen container
- section components
- hooks or action handlers

Do not regress toward giant page files with state, rendering, and side effects all mixed together.

## 8. Invalid Slug And Error Sanitization Are Already Guarded

The backend and frontend already enforce some important negative behavior:

- invalid professional slug format returns `400 invalid_slug`
- missing professional slug returns `404 not_found`
- internal errors are sanitized and must not leak raw filesystem or implementation details
- invalid localized frontend slugs must return `404`

If you change routing or backend detail lookup behavior, keep these guarantees intact.

## 9. Chat Is Live, But Not Yet Persistent

This is easy to misread.

Current status:

- websocket chat integration works
- connection, history, and message events work
- history is stored in memory per backend process
- Atlas schema exists for future persistent chat tables

Current non-status:

- chat messages are not yet being stored in PostgreSQL
- Redis is not yet being used for distributed realtime fanout

## 10. Release Versioning Has Two Different Roles

You need to keep these separate:

### Operational release identity

- git tag `vX.Y.Z`
- runtime `APP_VERSION`
- frontend `NEXT_PUBLIC_APP_VERSION`
- Docker OCI labels and image tag

### Changesets working manifest

- `packages/release/package.json`
- `packages/release/CHANGELOG.md`

The release manifest helps compute and record releases, but the deployed version identity is the tag and build metadata.

## 11. Generated Files Are Committed Intentionally

Committed generated files currently include:

- `packages/sdk/openapi.json`
- `packages/sdk/src/generated/types.ts`

Reasons:

- CI can validate drift
- frontend can typecheck without requiring a live backend
- reviewers can see contract diffs in PRs

Do not remove or hand-edit them casually.

## 12. Validation Is Local-First And CI-Agnostic

Current operating model:

- local commands are the source of truth for validation
- external CI is optional and should reuse those same commands
- heavy self-hosted Git platform infrastructure is intentionally not bundled in the repo anymore
- Codex can use `.codex/skills/bidanapp-preflight` to decide which checks are required before commit or PR

## 13. Quick Checklists

### If you change a backend response

1. update backend code
2. add or update tests
3. run `npm run contract:generate`
4. run `npm run generated:check`
5. update frontend or SDK adapters

### If you change a route

1. update route helpers if needed
2. verify locale handling
3. run frontend smoke tests
4. verify invalid slug or invalid path behavior if applicable

### If you change persistence

1. update Atlas schema
2. add or update migration files
3. update backend behavior
4. update docs that describe current storage status

## 14. Common Wrong Assumptions

- "If the backend has an endpoint, the data must already come from the database."
- "If OpenAPI exists, frontend can skip the SDK layer."
- "If local hooks pass, full preflight is complete."
- "If a package has a version field, it is the product release source of truth."
- "If Redis is in compose, the application must already depend on it."

All of those assumptions are wrong in the current repository state.
