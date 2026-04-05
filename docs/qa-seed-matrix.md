# QA Seed Matrix

This guide explains how to load the comprehensive backend seed and how to use the resulting accounts, review states, and tokens to validate the main product branches quickly.

## 1. Run The Seeder

Make sure the local infra is available and the schema is current first:

```bash
npm run qa:manual:setup
```

This root command already starts local infra, applies Atlas migrations, and reloads the canonical `comprehensive` seed.

Reset mutable backend state and print a human-readable report:

```bash
npm run seed --workspace @bidanapp/backend
```

Emit the same seeded runtime summary as JSON for automation or scripted smoke checks:

```bash
npm run qa:manual:summary
```

From the repo root you can use:

```bash
npm run seed:backend
npm run seed:backend:json
npm run qa:manual:summary
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

| Case | Suggested routes | Sample refs | Expected focus |
| --- | --- | --- | --- |
| `PUB-01` locale switch and onboarding entry | `/id`, `/en` | `runtime-default`, `jakarta-selatan-cilandak` | clean onboarding surface, locale switch, and access entry points |
| `PUB-02` public discovery surfaces | `/id/home`, `/id/explore`, `/id/services` | `s5 / konsultasi-laktasi`, `6 / clara-wijaya` | seeded catalog sections hydrate and browsing works as visitor |
| `PUB-03` published professional detail | `/id/p/clara-wijaya` | `6 / clara-wijaya`, `s5 / konsultasi-laktasi` | published trust, services, and booking surface behave like a live listing |
| `PUB-04` service-first discovery routing | `/id/s/konsultasi-laktasi` | `s5 / konsultasi-laktasi`, `6 / clara-wijaya` | service detail routes into a compatible professional flow |

### Customer personas

All customer accounts use password `Customer2026A`.

| Case | Persona | Phone | Home context | Strongest branches | Manual focus |
| --- | --- | --- | --- | --- | --- |
| `CUS-01` | Alya Rahma (`guest-primary`) | `+6281234567890` | Jakarta Selatan, Cilandak | almost every appointment status plus partial read notifications | profile hydration, notifications read state, appointment chat history, and active lifecycle states using `apt-005`, `apt-004`, and `thread-apt-005` |
| `CUS-02` | Nadia Prameswari (`ibu-nadia`) | `+628119021456` | Tangerang Selatan, Serpong | unread notifications and `requested` appointment state | unread badge behavior, request-status cards, and profile edits after refresh using `seed-qa-ibu-nadia-requested` |
| `CUS-03` | Hendra Saputra (`mr-hendra`) | `+6287812009087` | Surabaya, Tegalsari | `completed` and `cancelled` history | resolved appointment timeline, review/history flows, and favorites or location persistence using `seed-qa-mr-hendra-completed` and `seed-qa-mr-hendra-cancelled` |

### Professional personas

All professional accounts use password `Professional2026A`.

| Case | Persona | Phone | Market | Review status | Strongest branches |
| --- | --- | --- | --- | --- | --- |
| `PRO-01` | Clara Wijaya (`professionalId=6`) | `+6281370000001` | Jakarta Selatan, Cilandak | `published` | public catalog visibility, persisted dashboard edits, and `s5 / konsultasi-laktasi` as the anchor published service |
| `PRO-02` | Omeya Sen (`professionalId=1`) | `+6281370000002` | Surabaya, Tegalsari | `submitted` | read-only review-state handling while waiting for admin decision, anchored by `s1 / pijat-bayi` |
| `PRO-03` | Rani Hartati (`professionalId=4`) | `+6281370000003` | Tangerang Selatan, Serpong | `changes_requested` | review feedback visibility, edit-and-resubmit flow, anchored by `s7 / pendampingan-nifas` |
| `PRO-04` | Martha Teria (`professionalId=3`) | `+6281370000004` | Bandung, Coblong | `verified` | post-review pre-publish path and trust notifications, anchored by `s6 / terapi-gerak-stroke` |
| `PRO-05` | Alex Ben (`professionalId=2`) | `+6281370000005` | Medan, Petisah | `draft` | empty services, incomplete coverage, and onboarding prompts |
| `PRO-06` | Dimas Pratama (`professionalId=5`) | `+6281370000006` | Bekasi, Bekasi Selatan | `ready_for_review` | pre-review warnings when services exist but featured service is missing, anchored by `s3 / pijat-full-body` |

### Admin personas

Admin UI login uses the email below and the password configured in `apps/backend/.env` through `ADMIN_CONSOLE_CREDENTIALS_JSON`.

| Case | Persona | Email | Focus area | Manual focus |
| --- | --- | --- | --- | --- |
| `ADM-01` | Naya | `naya@ops.bidanapp.id` | support | support desk urgency mix and seeded command-center context using `ADM-CUS-1056`, `ADM-CUS-1048`, and `ADM-CUS-1036` |
| `ADM-02` | Rani | `rani@ops.bidanapp.id` | reviews | professional review operations and console hydration using `omeya-sen`, `rani-hartati`, and `ADM-CUS-1036` |
| `ADM-03` | Dimas | `dimas@ops.bidanapp.id` | ops | appointment and customer-side operational context using `ADM-CUS-1048` and `apt-007` |
| `ADM-04` | Vina | `vina@ops.bidanapp.id` | catalog | studio and service-table mutations using `s5 / konsultasi-laktasi`, `ADM-PRO-2069`, and `clara-wijaya` |

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

1. Run `PUB-01`: open `/id` and `/en`, verify onboarding renders cleanly and language switching changes route plus copy.
2. Run `PUB-02`: continue as a visitor, then open `/id/home`, `/id/explore`, and `/id/services`.
3. Run `PUB-03`: open `/id/p/clara-wijaya` and confirm the `published` professional is visible in public catalog and detail views.
4. Run `PUB-04`: open `/id/s/konsultasi-laktasi`, continue into professional selection, and confirm service-to-professional routing stays consistent.

### Customer flow: Alya Rahma

1. Run `CUS-01`: login at `/id/auth/customer` with `+6281234567890` and `Customer2026A`.
2. Open `/id/profile` and confirm session, profile data, and preferences hydrate immediately after login.
3. Open `/id/notifications` and confirm some appointment-related alerts are already read while others remain unread.
4. Open `/id/appointments`, then inspect active rows like `apt-005` and `apt-004`.
5. Open thread `thread-apt-005` and verify seeded history appears before sending a new message.

### Customer flow: Nadia Prameswari

1. Run `CUS-02`: login with `+628119021456` and `Customer2026A` at `/id/auth/customer`.
2. Confirm unread badges are still visible because no relevant notification has been pre-read.
3. Open `seed-qa-ibu-nadia-requested` and verify request-status cards, next steps, and confirmation copy align with backend state.
4. Edit customer profile fields, refresh the page, and verify the mutation persists.

### Customer flow: Hendra Saputra

1. Run `CUS-03`: login with `+6287812009087` and `Customer2026A` at `/id/auth/customer`.
2. Open completed and cancelled appointment history rows like `seed-qa-mr-hendra-completed` and `seed-qa-mr-hendra-cancelled`.
3. Verify timeline, cancellation context, and review/history surfaces remain coherent for closed journeys.
4. Switch between service detail and professional detail screens and confirm favorites plus location context stay stable.

### Professional flows by review state

1. Login at `/id/for-professionals` with the persona phone and `Professional2026A`.
2. Run `PRO-01` for Clara (`+6281370000001`) and verify requests, services, trust, and coverage edits persist after refresh while public surfaces reflect `clara-wijaya`.
3. Run `PRO-02` for Omeya (`+6281370000002`) and verify the `submitted` state is visible and editing or publish actions remain gated.
4. Run `PRO-03` for Rani (`+6281370000003`) and confirm admin feedback is visible, update portfolio or coverage data, and resubmit.
5. Run `PRO-04` for Martha (`+6281370000004`) and confirm the `verified` state is visible and the account is ready for final publish action.
6. Run `PRO-05` for Alex (`+6281370000005`) and verify draft or onboarding prompts, empty services, and incomplete coverage behavior.
7. Run `PRO-06` for Dimas (`+6281370000006`) and verify the `ready_for_review` warning path when services exist but the featured-service requirement is still unmet.

### Admin flows

1. Login at `/admin/login` with one of the seeded emails and the password from `ADMIN_CONSOLE_CREDENTIALS_JSON`.
2. Run `ADM-01`: open `/admin/support` and verify urgent, high, and normal tickets are present together with seeded command-center context.
3. Run `ADM-02`: open `/admin/professionals` and verify review-oriented tables stay hydrated from backend state.
4. Run `ADM-03`: open customers and appointments modules to confirm the console stays in sync after refresh.
5. Run `ADM-04`: open `/admin/services` and `/admin/studio`, make a safe admin mutation on a table row, and verify granular table sync persists to backend state.

## 7. How To Use The JSON Report

The JSON report is the easiest way to drive manual or automated QA because it exposes:

- `manualQaCases`
- `sampleEntityRefs`
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
npm --silent run qa:manual:summary | jq '.manualQaCases[] | {id, titleEn, sampleEntityRefs}'
```

```bash
npm --silent run qa:manual:summary | jq '.professionalScenarios[] | {professionalId, reviewStatus, suggestedChecks}'
```

```bash
npm --silent run qa:manual:summary | jq '.bearerTokens'
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
npm run qa:manual:smoke
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
npm run qa:manual:smoke -- --reuse-backend --base-url=http://127.0.0.1:8080/api/v1
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
