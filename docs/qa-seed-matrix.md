# QA Seed Matrix

This guide explains how to load the comprehensive backend seed and how to use the resulting accounts, review states, and tokens to validate the main product branches quickly.

## 1. Run The Seeder

Reset mutable backend state and print a human-readable report:

```bash
npm run seed --workspace @bidanapp/backend
```

Emit the same seeded runtime summary as JSON for automation or scripted smoke checks:

```bash
npm run seed:json --workspace @bidanapp/backend
```

From the repo root you can use:

```bash
npm run seed:backend
npm run seed:backend:json
```

## 2. What The Seeder Resets

The comprehensive scenario truncates and repopulates:

- `content_documents`
- `app_state_documents`
- `professional_portal_sessions`
- `chat_threads`
- `chat_messages`

After reset, the seeder rebuilds:

- public catalog and bootstrap content
- customer and professional auth registries
- admin, customer, and professional API bearer sessions
- professional portal resource slices
- customer preferences and notification read state
- professional notification read state
- admin support desk and admin console table state

## 3. Default Credentials

Unless overridden through flags:

- all customer accounts use password `Customer2026A`
- all professional accounts use password `Professional2026A`
- admin UI login still uses the password defined in `ADMIN_CONSOLE_CREDENTIALS_JSON`

The CLI report prints the seeded customer phones, professional phones, and seeded bearer tokens.

## 4. Coverage Matrix

The comprehensive scenario intentionally spans these core branches:

### Customer branches

- one customer with partially read notifications
- one customer with all relevant notifications still unread
- one customer focused on history and resolved appointment states

### Professional portal branches

- `published`
- `submitted`
- `changes_requested`
- `verified`
- `draft`
- `ready_for_review`

### Admin branches

- support desk with urgent, high, and normal tickets
- studio tables restored from backend state
- command-center context pointing at active operational issues

### Appointment branches

The seeded dataset is expected to cover the main appointment lifecycle states used by the product, and the exact counts are printed in the seed summary under `appointment_statuses`.

## 5. How To Use The JSON Report

The JSON report is the easiest way to drive manual or automated QA because it exposes:

- `customerScenarios`
- `professionalScenarios`
- `adminScenarios`
- `appointmentStatusCounts`
- `bearerTokens`

Useful examples:

```bash
npm --silent run seed:backend:json | jq '.customerScenarios'
```

```bash
npm --silent run seed:backend:json | jq '.professionalScenarios[] | {professionalId, reviewStatus, suggestedChecks}'
```

```bash
npm --silent run seed:backend:json | jq '.bearerTokens'
```

## 6. Recommended Verification Flow

Use the seed summary to run this quick sweep:

1. public catalog pages using a `published` professional
2. customer login, profile, notifications, appointment detail, and chat
3. professional login, portal edit, review-state handling, and request board
4. admin login, support desk, and studio data mutations
5. API smoke checks using the seeded bearer tokens

## 7. Automated Smoke Runner

For a self-contained backend smoke sweep, use:

```bash
npm run smoke:seeded
```

This command will:

- reset and reseed the backend runtime
- start the real backend API on `http://127.0.0.1:18080`
- verify public read-model endpoints
- verify customer and professional login flows
- verify protected customer, professional, and admin endpoints
- exercise a small set of safe mutations against persisted state

If you already have the backend running, reuse it instead:

```bash
npm run smoke:seeded -- --reuse-backend --base-url=http://127.0.0.1:8080/api/v1
```

If a future seed change adds or removes a branch, update this document together with `apps/backend/internal/seeding`.
