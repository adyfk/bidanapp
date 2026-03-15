# API Contract Alignment

This repo now uses a backend-generated contract flow with a single integration package so FE and BE stay aligned from one source of truth.

## Source Of Truth

- Backend contract source: `apps/backend/internal/platform/openapi/build.go`
- Generated artifacts:
  - `packages/sdk/openapi.json`
  - `packages/sdk/src/generated/types.ts`
- Root command: `npm run contract:generate`

`packages/sdk/openapi.json` is a generated output. Do not hand-edit it.

## Current Shape

- REST endpoints are registered in backend with Huma and exported into OpenAPI.
- TypeScript response types are generated with `openapi-typescript`.
- `packages/sdk` owns the generated contract and wraps it for FE consumption.
- Realtime chat uses the websocket handshake endpoint `GET /api/v1/ws/chat`.
- Because OpenAPI is not a strong format for bidirectional websocket frames, the handshake lives in OpenAPI while message event types live in `packages/sdk/src/realtime.ts`.

## Recommended Workflow

1. Change backend handler/service/DTO behavior first.
2. Keep Huma route registration and response envelopes aligned in backend.
3. Run `npm run contract:generate`.
4. Consume the result only through `@bidanapp/sdk` or thin FE adapters.
5. Keep screen components dependent on UI adapters, not raw transport DTOs.

## Why This Works

- Backend stays authoritative over actual response shapes.
- Frontend gets compile-time validation from generated types.
- SDK becomes the stable integration boundary for REST plus realtime helpers.
- UI hydration stays isolated. This matters because some simulation endpoints still use normalized transport payloads, such as `GET /api/v1/appointments`, while screens may prefer hydrated UI models.

## Package Placement Recommendation

- `packages/sdk`
  Generated OpenAPI artifact, generated TypeScript types, REST client factories, websocket URL helpers, and shared FE-facing transport types.
- `packages/sdk/src/adapters/*`
  Optional transport-to-frontend adapter helpers when multiple screens need the same normalized contract view.
- `apps/frontend/src/lib/api/*`
  Optional adapter layer that maps backend DTOs into page-specific UI models.

This keeps OpenAPI as the transport contract and prevents screen components from being coupled directly to backend-normalized payloads.
