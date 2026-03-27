# Manual QA Playbook

This is the fastest path to a repeatable local demo or manual QA pass against the seeded BidanApp runtime.

Use this document when you need one entrypoint that combines setup, demo accounts, suggested routes, and per-case validation focus.

Read these detailed references together when you need deeper context:

- [Getting Started](./getting-started.md)
- [QA Seed Matrix](./qa-seed-matrix.md)
- [User Flow Pack](./user-flows/README.md)
- [Seed Data Blueprint](./seed-data/README.md)

## 1. One-Time Local Setup

Install dependencies and create the local env files:

```bash
npm install
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

The default local runtime uses:

- frontend at `http://localhost:3000`
- backend at `http://localhost:8080/api/v1`
- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`

## 2. Manual QA Setup Command

Prepare a clean seeded QA environment from the repo root:

```bash
npm run qa:manual:setup
```

This command will:

- start local PostgreSQL and Redis through Docker Compose
- apply the current Atlas migrations
- reset and reseed the backend runtime with the comprehensive QA dataset

After that, start the app stack:

```bash
npm run dev
```

If you only need one app:

```bash
npm run dev:backend
npm run dev:frontend
```

Use `npm run qa:manual:setup` again any time you want to return to a clean state before another manual pass.

## 3. Local URLs

- visitor entry: `http://localhost:3000/id`
- English visitor entry: `http://localhost:3000/en`
- customer access: `http://localhost:3000/id/auth/customer`
- professional access: `http://localhost:3000/id/for-professionals`
- admin login: `http://localhost:3000/admin/login`
- backend health: `http://localhost:8080/api/v1/health`
- backend docs: `http://localhost:8080/api/v1/docs`

## 4. Current Seeded Runtime Coverage

The comprehensive seed is designed to cover:

- visitor browsing across `/id` and `/en`
- 3 seeded customer personas
- 6 seeded professional personas
- 4 seeded admin personas
- 7 seeded city contexts
- appointment lifecycle states from `requested` through `completed` plus `cancelled`, `rejected`, and `expired`
- all seeded service delivery modes: `home_visit`, `online`, and `onsite`
- both booking flows: `instant` and `request`

If you want the machine-readable snapshot that matches the currently installed seed data, run:

```bash
npm --silent run seed:backend:json
```

## 5. Demo Accounts

### Customer accounts

All customer accounts use password `Customer2026A`.

| Persona | Phone | Best for |
| --- | --- | --- |
| Alya Rahma | `+6281234567890` | mixed active lifecycle states, partial notification read state, appointment chat |
| Nadia Prameswari | `+628119021456` | unread notifications and `requested` appointment branch |
| Hendra Saputra | `+6287812009087` | `completed` and `cancelled` history-heavy flows |

### Professional accounts

All professional accounts use password `Professional2026A`.

| Persona | Phone | Review state | Best for |
| --- | --- | --- | --- |
| Clara Wijaya | `+6281370000001` | `published` | public visibility and persisted dashboard edits |
| Omeya Sen | `+6281370000002` | `submitted` | read-only waiting-review behavior |
| Rani Hartati | `+6281370000003` | `changes_requested` | revision and resubmission flow |
| Martha Teria | `+6281370000004` | `verified` | approved but not yet published flow |
| Alex Ben | `+6281370000005` | `draft` | incomplete onboarding and missing setup prompts |
| Dimas Pratama | `+6281370000006` | `ready_for_review` | pre-review warnings and missing featured service |

### Admin accounts

Use the email below together with the password configured in `apps/backend/.env` under `ADMIN_CONSOLE_CREDENTIALS_JSON`.
If you copied `apps/backend/.env.example` into `apps/backend/.env`, keep the same configured development credential set in sync there.

| Persona | Email | Focus area |
| --- | --- | --- |
| Naya | `naya@ops.bidanapp.id` | support |
| Rani | `rani@ops.bidanapp.id` | reviews |
| Dimas | `dimas@ops.bidanapp.id` | ops |
| Vina | `vina@ops.bidanapp.id` | catalog |

## 6. Demo Cases

### Public and visitor cases

| Case | Start routes | Login | What to validate |
| --- | --- | --- | --- |
| `PUB-01` locale and onboarding | `/id`, `/en` | none | onboarding renders cleanly, locale switch works, and access entrypoints are visible |
| `PUB-02` public discovery | `/id/home`, `/id/explore`, `/id/services` | none | seeded catalog sections hydrate and visitor browsing remains stable |
| `PUB-03` published professional detail | `/id/p/clara-wijaya` | none | published trust, services, and booking surface look production-ready |
| `PUB-04` service-first routing | `/id/s/pijat-bayi` | none | service detail routes into a compatible professional flow without broken state |

### Customer cases

| Case | Persona | Start routes | What to validate |
| --- | --- | --- | --- |
| `CUS-01` active lifecycle and chat | Alya Rahma | `/id/auth/customer`, `/id/profile`, `/id/notifications`, `/id/appointments` | session and profile hydrate immediately, some alerts are already read, active appointment states are visible, and seeded chat history is present before a new send |
| `CUS-02` unread and request state | Nadia Prameswari | `/id/auth/customer`, `/id/notifications`, `/id/appointments` | unread badges remain visible, the `requested` state is coherent, and profile edits persist after refresh |
| `CUS-03` history and resolved journeys | Hendra Saputra | `/id/auth/customer`, `/id/appointments`, `/id/services`, `/id/p/clara-wijaya` | completed and cancelled journeys remain coherent, review or history surfaces stay stable, and favorites plus location context survive navigation |

### Professional cases

| Case | Persona | Start routes | What to validate |
| --- | --- | --- | --- |
| `PRO-01` published portal | Clara Wijaya | `/id/for-professionals`, `/id/for-professionals/dashboard/requests`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/coverage`, `/id/for-professionals/dashboard/trust` | portal hydration comes from backend state, edits persist after refresh, and public surfaces reflect the published profile |
| `PRO-02` submitted review gate | Omeya Sen | `/id/for-professionals`, `/id/for-professionals/dashboard/overview` | submitted state is visible and editing or publish actions stay appropriately gated |
| `PRO-03` changes requested | Rani Hartati | `/id/for-professionals`, `/id/for-professionals/dashboard/portfolio`, `/id/for-professionals/dashboard/coverage` | admin feedback is visible, data can be revised, and the resubmission path is coherent |
| `PRO-04` verified pre-publish | Martha Teria | `/id/for-professionals`, `/id/for-professionals/dashboard/trust` | verified outcome is visible and the account is ready for final publish action |
| `PRO-05` draft onboarding gaps | Alex Ben | `/id/for-professionals`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/coverage` | empty services, incomplete coverage, and onboarding prompts remain visible |
| `PRO-06` ready for review warning | Dimas Pratama | `/id/for-professionals`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/overview` | services exist, featured service is still missing, and pre-review warnings are clear |

### Admin cases

| Case | Persona | Start routes | What to validate |
| --- | --- | --- | --- |
| `ADM-01` support desk triage | Naya | `/admin/login`, `/admin/support` | urgent, high, and normal support tickets are visible with seeded command-center context |
| `ADM-02` professional review operations | Rani | `/admin/login`, `/admin/professionals` | professional review-oriented console screens hydrate and remain stable after refresh |
| `ADM-03` operational booking context | Dimas | `/admin/login`, `/admin/customers`, `/admin/appointments` | customer and appointment modules stay aligned with seeded operational state |
| `ADM-04` catalog and studio edits | Vina | `/admin/login`, `/admin/services`, `/admin/studio` | table hydration comes from backend state and safe row-level mutations persist |

## 7. Recommended Manual QA Order

Run this sequence when you want a focused regression pass:

1. Reset with `npm run qa:manual:setup`.
2. Start the app with `npm run dev`.
3. Run the public cases `PUB-01` through `PUB-04`.
4. Run customer cases `CUS-01` through `CUS-03`.
5. Run professional cases `PRO-01` through `PRO-06`.
6. Run admin cases `ADM-01` through `ADM-04`.
7. If any state becomes unclear after mutations, reset the seed and repeat only the affected pack.

## 8. Optional Automated Backstop

Before or after manual QA, you can run the automated seeded checks:

```bash
npm run smoke:seeded
```

For browser E2E against the same seeded dataset:

```bash
npm run mcp:playwright:install
PLAYWRIGHT_BACKEND_MODE=seeded npm run test:e2e:frontend
```

## 9. Source Of Truth

Use this playbook as the short operational entrypoint.

Use the deeper docs when you need detail:

- [QA Seed Matrix](./qa-seed-matrix.md) for the complete seeded scenario map
- [User Flow Pack](./user-flows/README.md) for screen-by-screen product behavior
- [Seed Data Blueprint](./seed-data/README.md) for the normalized dummy data model behind the demo cases
