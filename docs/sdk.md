# SDK And API Contract

This document explains how frontend and backend stay aligned through `@bidanapp/sdk`, what is generated, what is hand-written, and how to work safely when API contracts change.

## 1. Why The SDK Exists

The repository needs one FE-facing integration boundary that is:

- generated from backend-owned contracts
- usable by the frontend without duplicating schemas
- capable of handling REST and realtime concerns together
- stable enough to support screen-by-screen migration from simulation data to live backend data

`packages/sdk` is that boundary.

## 2. What Lives In `packages/sdk`

Current contents:

```text
packages/sdk
├── openapi.json                # generated OpenAPI artifact
└── src
    ├── generated/types.ts      # generated TypeScript types
    ├── client.ts               # typed REST client factory
    ├── realtime.ts             # websocket URL helper and event types
    ├── adapters/integration.ts # frontend-facing adapter example
    └── index.ts                # public exports
```

## 3. Source Of Truth Rules

These rules are non-negotiable:

- backend code is the source of truth for REST contracts
- `packages/sdk/openapi.json` is generated output
- `packages/sdk/src/generated/types.ts` is generated output
- frontend should import from `@bidanapp/sdk`, not from ad hoc OpenAPI codegen scattered elsewhere

Do not hand-edit generated files.

## 4. Contract Generation Flow

The root command is:

```bash
npm run contract:generate
```

That resolves to the SDK workspace generation flow:

1. run `apps/backend/cmd/openapi-export`
2. write the generated spec to `packages/sdk/openapi.json`
3. run `openapi-typescript`
4. write generated types to `packages/sdk/src/generated/types.ts`

The repository guards these generated files with:

- `npm run generated:check`
- CI contract drift checks inside `npm run ci:check`

## 5. REST Boundary

`src/client.ts` owns typed REST client creation.

The frontend should use it like this:

```ts
import { createBidanappApiClient } from '@bidanapp/sdk';

const client = createBidanappApiClient('http://localhost:8080/api/v1');
const result = await client.GET('/health');
```

Why this matters:

- path strings are typed
- response envelopes are typed
- frontend callers stay aligned with backend-generated operations

## 6. Realtime Boundary

Realtime support lives in `src/realtime.ts`.

That file currently owns:

- `ChatSocketParams`
- `ChatClientMessage`
- `ChatLiveMessage`
- `ChatServerEvent`
- `createChatWebSocketUrl`

This is intentional.

REST and websocket concerns are not identical:

- OpenAPI is great for REST route discovery and schema generation
- OpenAPI is weak for websocket frame exchange
- SDK is the correct place for FE-consumed event types and connection helpers

## 7. Adapter Layer

The SDK can also expose thin frontend-facing adapters.

Current example:

- `src/adapters/integration.ts`

This adapter:

- calls multiple backend endpoints in parallel
- normalizes them into one small UI-friendly shape
- prevents page code from repeating transport details

This is the recommended place for shared FE-facing normalization when multiple screens need the same view of backend data.

## 8. How Frontend Should Consume The SDK

Recommended layering:

```text
frontend route or screen
  -> feature hook or action handler
  -> @bidanapp/sdk client or adapter
  -> backend
```

Use cases:

- import generated transport indirectly through client calls
- import websocket event types from `@bidanapp/sdk`
- import shared adapters when the normalization is cross-screen

Avoid:

- placing raw fetch logic directly inside screens everywhere
- duplicating response interfaces in frontend code
- bypassing the SDK when the backend contract already exists there

## 9. Typical Change Workflow

If a backend response changes:

1. update backend code first
2. keep Huma route definitions and response structs aligned
3. run `npm run contract:generate`
4. update SDK adapters if needed
5. update frontend consumers
6. run local checks

If only a frontend mapping changes and backend contract is unchanged:

- you may only need to update SDK adapters or frontend page adapters
- generated artifacts should remain untouched

## 10. Current Limits

- `@bidanapp/sdk` is not intended for npm publishing at this stage
- it is a workspace integration boundary for this monorepo
- some frontend screens still consume simulation-hydrated data and have not migrated to SDK-backed transport
- websocket event contracts are typed, but not yet persisted to database-backed chat storage

## 11. Key Commands

Generate contract artifacts:

```bash
npm run contract:generate
```

Check generated files are committed:

```bash
npm run generated:check
```

Typecheck the SDK:

```bash
npm run typecheck --workspace @bidanapp/sdk
```

## 12. Common Mistakes To Avoid

- editing `openapi.json` manually
- editing `generated/types.ts` manually
- adding a second contract package outside the SDK
- coupling frontend screens directly to backend-normalized payloads without a thin adapter
- forgetting to regenerate the SDK after backend contract changes
- trying to force websocket frame contracts entirely into raw OpenAPI
