# Manual QA Playbook

This is the fastest operator entrypoint for repeatable manual QA on the seeded BidanApp runtime.

If your testers prefer Bahasa Indonesia, use the companion guide: [Manual QA Playbook (Bahasa Indonesia)](./manual-qa-playbook.id.md).

Use these references when you need more detail:

- [Getting Started](./getting-started.md)
- [QA Seed Matrix](./qa-seed-matrix.md)
- [User Flow Pack](./user-flows/README.md)
- [Seed Data Blueprint](./seed-data/README.md)

## 1. One-Time Local Setup

Install dependencies and create local env files:

```bash
npm install
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

The default local runtime uses:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:8080/api/v1`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## 2. Reset To The Comprehensive QA Seed

From the repo root, prepare a clean runtime:

```bash
npm run qa:manual:setup
```

This command:

- starts PostgreSQL and Redis through Docker Compose
- applies the current Atlas migrations
- resets and reseeds the backend with the canonical `comprehensive` scenario

Start the apps after seeding:

```bash
npm run dev
```

If you only need one app:

```bash
npm run dev:backend
npm run dev:frontend
```

Generate the machine-readable QA pack:

```bash
npm run qa:manual:summary
```

Useful quick inspection:

```bash
npm --silent run qa:manual:summary | jq '.manualQaCases[] | {id, titleEn, startRoutes, sampleEntityRefs}'
```

Use `npm run qa:manual:setup` again whenever you want to return to a known-good baseline before another pass.

## 3. Local URLs

- visitor entry: `http://localhost:3000/id`
- English visitor entry: `http://localhost:3000/en`
- customer sign-in: `http://localhost:3000/id/auth/customer`
- professional sign-in: `http://localhost:3000/id/for-professionals`
- admin login: `http://localhost:3000/admin/login`
- backend health: `http://localhost:8080/api/v1/health`
- backend docs: `http://localhost:8080/api/v1/docs`

## 4. Seeded Runtime Coverage

The comprehensive QA seed is designed to cover:

- 17 stable manual QA cases with IDs from `PUB-01` through `ADM-04`
- visitor browsing across Indonesian and English locale entrypoints
- 3 customer personas with active, unread, and history-heavy branches
- 6 professional personas spanning `published`, `submitted`, `changes_requested`, `verified`, `draft`, and `ready_for_review`
- 4 admin personas across support, reviews, ops, and catalog
- appointment lifecycle states from `requested` through `completed` plus `cancelled`, `rejected`, and `expired`
- all service delivery modes: `home_visit`, `online`, and `onsite`
- both booking flows: `instant` and `request`

The JSON summary now includes:

- `manualQaCases`
- `sampleEntityRefs`
- `customerScenarios`
- `professionalScenarios`
- `adminScenarios`

## 5. Seeded QA Accounts

### Customer accounts

All customer accounts use password `Customer2026A`.

| Persona | Phone | Best for |
| --- | --- | --- |
| Alya Rahma | `+6281234567890` | active lifecycle states, partial notification read state, seeded appointment chat |
| Nadia Prameswari | `+628119021456` | unread notifications and the `requested` branch |
| Hendra Saputra | `+6287812009087` | completed and cancelled history-heavy journeys |

### Professional accounts

All professional accounts use password `Professional2026A`.

| Persona | Phone | Review state | Best for |
| --- | --- | --- | --- |
| Clara Wijaya | `+6281370000001` | `published` | public visibility and persisted dashboard edits |
| Omeya Sen | `+6281370000002` | `submitted` | read-only review waiting behavior |
| Rani Hartati | `+6281370000003` | `changes_requested` | revision and resubmission flow |
| Martha Teria | `+6281370000004` | `verified` | approved but not yet published flow |
| Alex Ben | `+6281370000005` | `draft` | incomplete onboarding and missing setup prompts |
| Dimas Pratama | `+6281370000006` | `ready_for_review` | pre-review warnings and missing featured service |

### Admin accounts

Use the email below together with the password configured in `apps/backend/.env` under `ADMIN_CONSOLE_CREDENTIALS_JSON`.

| Persona | Email | Focus area |
| --- | --- | --- |
| Naya Pratama | `naya@ops.bidanapp.id` | support |
| Rani Setiawan | `rani@ops.bidanapp.id` | reviews |
| Dimas Putra | `dimas@ops.bidanapp.id` | ops |
| Vina Lestari | `vina@ops.bidanapp.id` | catalog |

## 6. Manual QA Case Pack

### Public cases

| Case | Start routes | Sample refs from the seed | Validate |
| --- | --- | --- | --- |
| `PUB-01` locale switch and onboarding entry | `/id`, `/en` | `runtime-default`, `jakarta-selatan-cilandak` | onboarding renders cleanly, locale switch is stable, and the seeded visitor context stays deterministic |
| `PUB-02` public discovery surfaces | `/id/home`, `/id/explore`, `/id/services` | service `s5 / konsultasi-laktasi`, professional `6 / clara-wijaya` | catalog sections hydrate, discovery cards stay consistent, and trust or CTA states remain coherent |
| `PUB-03` published professional detail | `/id/p/clara-wijaya` | professional `6 / clara-wijaya`, service `s5 / konsultasi-laktasi` | published trust, services, and booking entrypoints look production-ready |
| `PUB-04` service-first discovery routing | `/id/s/konsultasi-laktasi` | service `s5 / konsultasi-laktasi`, professional `6 / clara-wijaya` | service detail resolves cleanly and continues into a compatible professional flow |

### Customer cases

| Case | Persona | Start routes | Sample refs from the seed | Validate |
| --- | --- | --- | --- | --- |
| `CUS-01` active lifecycle and seeded chat | Alya Rahma | `/id/auth/customer`, `/id/profile`, `/id/notifications`, `/id/appointments` | appointments `apt-005`, `apt-004`, chat thread `thread-apt-005` | session and profile hydrate immediately, partially read notifications stay coherent, and seeded chat history appears before a new send |
| `CUS-02` unread notifications and requested state | Nadia Prameswari | `/id/auth/customer`, `/id/notifications`, `/id/appointments` | appointment `seed-qa-ibu-nadia-requested` | unread badges remain visible, the requested-state card matches backend state, and profile edits persist after refresh |
| `CUS-03` history and resolved journeys | Hendra Saputra | `/id/auth/customer`, `/id/appointments`, `/id/services`, `/id/p/clara-wijaya` | appointments `seed-qa-mr-hendra-completed`, `seed-qa-mr-hendra-cancelled`, professional `clara-wijaya` | completed and cancelled timelines remain coherent, review/history surfaces stay stable, and favorites or location context survive navigation |

### Professional cases

| Case | Persona | Start routes | Sample refs from the seed | Validate |
| --- | --- | --- | --- | --- |
| `PRO-01` published professional portal | Clara Wijaya | `/id/for-professionals`, `/id/for-professionals/dashboard/requests`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/coverage`, `/id/for-professionals/dashboard/trust` | professional `6 / clara-wijaya`, service `s5 / konsultasi-laktasi` | portal hydration comes from backend state, edits persist after refresh, and the public profile reflects the published state |
| `PRO-02` submitted review gate | Omeya Sen | `/id/for-professionals`, `/id/for-professionals/dashboard/overview` | professional `1 / omeya-sen`, service `s1 / pijat-bayi` | submitted state is visible and review-gated actions stay appropriately locked |
| `PRO-03` changes-requested revision flow | Rani Hartati | `/id/for-professionals`, `/id/for-professionals/dashboard/portfolio`, `/id/for-professionals/dashboard/coverage` | professional `4 / rani-hartati`, service `s7 / pendampingan-nifas` | admin feedback is visible, data can be revised, and resubmission remains coherent |
| `PRO-04` verified pre-publish state | Martha Teria | `/id/for-professionals`, `/id/for-professionals/dashboard/trust` | professional `3 / martha-teria`, service `s6 / terapi-gerak-stroke` | verified outcome is visible and the profile is ready for final publish action |
| `PRO-05` draft onboarding gaps | Alex Ben | `/id/for-professionals`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/coverage` | professional `2 / alex-ben` | empty services, missing coverage, and onboarding prompts remain visible |
| `PRO-06` ready-for-review warning path | Dimas Pratama | `/id/for-professionals`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/overview` | professional `5 / dimas-pratama`, service `s3 / pijat-full-body` | services exist, featured-service requirements are still unmet, and warning paths stay clear |

### Admin cases

| Case | Persona | Start routes | Sample refs from the seed | Validate |
| --- | --- | --- | --- | --- |
| `ADM-01` support desk triage | Naya Pratama | `/admin/login`, `/admin/support` | tickets `ADM-CUS-1056`, `ADM-CUS-1048`, `ADM-CUS-1036` | urgent, high, and normal tickets appear together with seeded command-center context |
| `ADM-02` professional review operations | Rani Setiawan | `/admin/login`, `/admin/professionals` | professionals `1 / omeya-sen`, `4 / rani-hartati`, ticket `ADM-CUS-1036` | review-oriented console screens hydrate from backend state and remain stable after refresh |
| `ADM-03` operational booking context | Dimas Putra | `/admin/login`, `/admin/customers`, `/admin/appointments` | ticket `ADM-CUS-1048`, appointment `apt-007` | customer and appointment modules stay aligned with seeded operational state |
| `ADM-04` catalog and studio edits | Vina Lestari | `/admin/login`, `/admin/services`, `/admin/studio` | service `s5 / konsultasi-laktasi`, ticket `ADM-PRO-2069`, professional `6 / clara-wijaya` | backend-owned table hydration is present and safe row-level edits persist |

## 7. Recommended QA Order

Use this order for a focused regression sweep:

1. Reset with `npm run qa:manual:setup`.
2. Start the app with `npm run dev`.
3. Run `PUB-01` through `PUB-04`.
4. Run `CUS-01` through `CUS-03`.
5. Run `PRO-01` through `PRO-06`.
6. Run `ADM-01` through `ADM-04`.
7. If the runtime becomes unclear after mutations, reseed and rerun only the affected case pack.

## 8. Optional Automated Backstop

Run the seeded smoke pack:

```bash
npm run qa:manual:smoke
```

Run browser E2E against the same seeded dataset:

```bash
npm run mcp:playwright:install
PLAYWRIGHT_BACKEND_MODE=seeded npm run test:e2e:frontend
```

## 9. Source Of Truth

Use this playbook as the short operational guide.

Use the deeper docs when needed:

- [QA Seed Matrix](./qa-seed-matrix.md) for the full seeded scenario map, counts, and CLI examples
- [User Flow Pack](./user-flows/README.md) for screen-by-screen product behavior
- [Seed Data Blueprint](./seed-data/README.md) for the normalized seed model behind these scenarios
