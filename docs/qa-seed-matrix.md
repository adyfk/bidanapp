# QA Seed Matrix

This guide explains how to load the comprehensive backend seed and how to use the resulting accounts, review states, and tokens to validate the main product branches quickly.

## 1. Run The Seeder

Make sure the local infra is available and the schema is current first:

```bash
npm run infra:up
npm run atlas:apply --workspace @bidanapp/backend
```

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

- `published_readmodel_documents`
- `professional_portal_states`
- `viewer_session_states`
- `customer_notification_states`
- `professional_notification_states`
- `consumer_preference_states`
- `admin_session_states`
- `admin_support_desk_states`
- `support_tickets`
- `admin_console_states`
- `admin_console_tables`
- `admin_console_table_rows`
- `chat_threads`
- `chat_messages`

After reset, the seeder rebuilds:

- public catalog and bootstrap content
- database-backed customer and professional auth accounts
- database-backed admin, customer, and professional API bearer sessions
- professional portal resource slices
- customer preferences and notification read state
- professional notification read state
- admin support desk and admin console table state

## 3. Default Credentials

Unless overridden through flags:

- all customer accounts use password `Customer2026A`
- all professional accounts use password `Professional2026A`
- admin UI login uses credentials bootstrapped into the database from `ADMIN_CONSOLE_CREDENTIALS_JSON`

The CLI report prints the seeded customer phones, professional phones, and seeded bearer tokens.

## 4. Current Seeded Personas

### Public and visitor coverage

| Flow | Suggested routes | Expected focus |
| --- | --- | --- |
| onboarding and language switch | `/id`, `/en` | clean onboarding surface, locale switch, and access entry points |
| public discovery | `/id/home`, `/id/explore`, `/id/services` | seeded catalog sections hydrate and browsing works as visitor |
| published professional detail | `/id/p/clara-wijaya` | published trust, services, and booking surface behave like a live listing |
| service-first discovery | `/id/s/pijat-bayi` | service detail routes into a compatible professional flow |

### Customer personas

All customer accounts use password `Customer2026A`.

| Persona | Phone | Home context | Strongest branches | Manual focus |
| --- | --- | --- | --- | --- |
| Alya Rahma (`guest-primary`) | `+6281234567890` | Jakarta Selatan, Cilandak | almost every appointment status plus partial read notifications | profile hydration, notifications read state, appointment chat history, active lifecycle states |
| Nadia Prameswari (`ibu-nadia`) | `+628119021456` | Tangerang Selatan, Serpong | unread notifications and `requested` appointment state | unread badge behavior, request-status cards, profile edits after refresh |
| Hendra Saputra (`mr-hendra`) | `+6287812009087` | Surabaya, Tegalsari | `completed` and `cancelled` history | resolved appointment timeline, review/history flows, favorites and location persistence |

### Professional personas

All professional accounts use password `Professional2026A`.

| Persona | Phone | Market | Review status | Strongest branches |
| --- | --- | --- | --- | --- |
| Clara Wijaya (`professionalId=6`) | `+6281370000001` | Jakarta Selatan, Cilandak | `published` | public catalog visibility, persisted dashboard edits, featured service behavior |
| Omeya Sen (`professionalId=1`) | `+6281370000002` | Surabaya, Tegalsari | `submitted` | read-only review-state handling while waiting for admin decision |
| Rani Hartati (`professionalId=4`) | `+6281370000003` | Tangerang Selatan, Serpong | `changes_requested` | review feedback visibility, edit-and-resubmit flow |
| Martha Teria (`professionalId=3`) | `+6281370000004` | Bandung, Coblong | `verified` | post-review pre-publish path and trust notifications |
| Alex Ben (`professionalId=2`) | `+6281370000005` | Medan, Petisah | `draft` | empty services, incomplete coverage, onboarding prompts |
| Dimas Pratama (`professionalId=5`) | `+6281370000006` | Bekasi, Bekasi Selatan | `ready_for_review` | pre-review warnings when services exist but featured service is missing |

### Admin personas

Admin UI login uses the email below and the password configured in `apps/backend/.env` through `ADMIN_CONSOLE_CREDENTIALS_JSON`.

| Persona | Email | Focus area | Manual focus |
| --- | --- | --- | --- |
| Naya | `naya@ops.bidanapp.id` | support | support desk urgency mix and seeded command-center context |
| Rani | `rani@ops.bidanapp.id` | reviews | professional review operations and console hydration |
| Dimas | `dimas@ops.bidanapp.id` | ops | appointment and customer-side operational context |
| Vina | `vina@ops.bidanapp.id` | catalog | studio and service-table mutations |

## 5. Coverage Matrix

The comprehensive scenario intentionally spans these core branches:

### Indonesia market coverage

| Market | Seeded areas | Business rationale in QA |
| --- | --- | --- |
| Jakarta Selatan and Jakarta Pusat | Cilandak, Menteng | urban family-care, consultation-heavy, and payment or approval edge cases |
| Tangerang Selatan | Serpong, Pamulang | suburban postpartum homecare with repeat-booking and schedule-change risk |
| Surabaya | Tegalsari, Sukolilo | newborn care across home-visit and onsite operations |
| Bandung | Coblong | rehabilitation homecare and caregiver-assisted appointments |
| Bekasi | Bekasi Selatan | after-work recovery demand, instant booking, and onsite fulfillment |
| Medan | Petisah | wellness and sunnah-therapy mixes with home-visit and onsite branches |

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

Current mode and booking-flow coverage from the comprehensive seed:

| Dimension | Values |
| --- | --- |
| service modes | `home_visit`, `online`, `onsite` |
| appointment requested modes | `home_visit`, `online`, `onsite` |
| booking flows | `instant`, `request` |

Current appointment status counts from the comprehensive seed:

| Status | Count |
| --- | --- |
| `requested` | 2 |
| `approved_waiting_payment` | 1 |
| `paid` | 1 |
| `confirmed` | 2 |
| `in_service` | 1 |
| `completed` | 4 |
| `cancelled` | 2 |
| `rejected` | 1 |
| `expired` | 1 |

Current professional portal review-state counts from the comprehensive seed:

| Review status | Count |
| --- | --- |
| `published` | 1 |
| `submitted` | 1 |
| `changes_requested` | 1 |
| `verified` | 1 |
| `draft` | 1 |
| `ready_for_review` | 1 |

## 6. Manual QA Flow Pack

### Visitor and public browsing

1. Open `/id` and `/en`, verify onboarding renders cleanly and language switcher changes copy.
2. Continue as visitor, then open `/id/home`, `/id/explore`, and `/id/services`.
3. Open `/id/p/clara-wijaya` and confirm a `published` professional is visible in public catalog and detail views.
4. Open `/id/s/pijat-bayi`, continue into professional selection, and confirm service-to-professional routing stays consistent.

### Customer flow: Alya Rahma

1. Login at `/id/auth/customer` with `+6281234567890` and `Customer2026A`.
2. Open `/id/profile` and confirm session, profile data, and preferences hydrate immediately after login.
3. Open `/id/notifications` and confirm some appointment-related alerts are already read while others remain unread.
4. Open `/id/appointments`, then inspect active rows across request, payment, confirmed, and in-service branches.
5. Open an appointment chat thread and verify seeded history appears before sending a new message.

### Customer flow: Nadia Prameswari

1. Login with `+628119021456` and `Customer2026A` at `/id/auth/customer`.
2. Confirm unread badges are still visible because no relevant notification has been pre-read.
3. Open the `requested` appointment state and verify request-status cards, next steps, and confirmation copy align with backend state.
4. Edit customer profile fields, refresh the page, and verify the mutation persists.

### Customer flow: Hendra Saputra

1. Login with `+6287812009087` and `Customer2026A` at `/id/auth/customer`.
2. Open completed and cancelled appointment history rows.
3. Verify timeline, cancellation context, and review/history surfaces remain coherent for closed journeys.
4. Switch between service detail and professional detail screens and confirm favorites plus location context stay stable.

### Professional flows by review state

1. Login at `/id/for-professionals` with the persona phone and `Professional2026A`.
2. For Clara (`+6281370000001`), verify requests, services, trust, and coverage edits persist after refresh and that public surfaces reflect the `published` state.
3. For Omeya (`+6281370000002`), verify the `submitted` state is visible and editing or publish actions remain gated.
4. For Rani (`+6281370000003`), confirm admin feedback is visible, update portfolio or coverage data, and resubmit.
5. For Martha (`+6281370000004`), confirm the `verified` state is visible and the account is ready for final publish action.
6. For Alex (`+6281370000005`), verify draft/onboarding prompts, empty services, and incomplete coverage behavior.
7. For Dimas (`+6281370000006`), verify the `ready_for_review` warning path when services exist but the featured-service requirement is still unmet.

### Admin flows

1. Login at `/admin/login` with one of the seeded emails and the password from `ADMIN_CONSOLE_CREDENTIALS_JSON`.
2. Open `/admin/support` and verify urgent, high, and normal tickets are present together with seeded command-center context.
3. Open `/admin/studio` and verify admin console tables hydrate from backend state without browser-only fallback data.
4. Open customers, professionals, services, and appointments modules to confirm the console and support desk stay in sync after refresh.
5. Make a safe admin mutation on a table row and verify granular table sync persists to backend state and is reflected by the matching runtime surface after refresh.

## 7. How To Use The JSON Report

The JSON report is the easiest way to drive manual or automated QA because it exposes:

- `coveredCities`
- `customerScenarios`
- `professionalScenarios`
- `adminScenarios`
- `appointmentStatusCounts`
- `supportedServiceModes`
- `supportedBookingFlows`
- `supportedAppointmentModes`
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

## 8. Recommended Verification Flow

Use the seed summary to run this quick sweep:

1. public catalog pages using a `published` professional
2. customer login, profile, notifications, appointment detail, and chat
3. professional login, portal edit, review-state handling, and request board
4. admin login, support desk, and studio data mutations
5. API smoke checks using the seeded bearer tokens

## 9. Automated Verification

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

For seeded browser E2E against the same dataset:

```bash
npm run mcp:playwright:install
PLAYWRIGHT_BACKEND_MODE=seeded npm run test:e2e:frontend
```

The Playwright suite covers:

- public and access routes rendering without runtime crashes
- customer UI login and protected-route reuse
- professional UI login and dashboard-route reuse
- seeded bearer-token access for customer, professional, and admin protected surfaces
- defensive hydration behavior when `/catalog` returns malformed professional rows

If a future seed change adds or removes a branch, update this document together with `apps/backend/internal/seeding`.
