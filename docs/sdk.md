# SDK

`@marketplace/sdk` is the typed boundary between the V2 frontend apps and the backend.

## What it contains

- generated OpenAPI artifact
- generated TypeScript operation and schema types
- typed API client creator
- realtime chat helpers
- thin V2 adapters for:
  - admin auth
  - admin review
  - viewer auth
  - platform registry
  - professional onboarding
  - offerings and orders

## Workflow

When backend contracts change:

```bash
npm run contract:generate
```

This exports the backend OpenAPI contract and regenerates the SDK types.

## Rule

The SDK should only expose V2 APIs. Appointment-era adapters, split auth adapters, read-model adapters, and professional portal runtime adapters are not part of the supported surface anymore.
