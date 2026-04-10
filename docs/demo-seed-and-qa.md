# Demo Seed And QA

## Tujuan

Dokumen ini menjelaskan apa saja yang di-seed ke local database, credential yang bisa dipakai, dan skenario QA utama yang siap diuji.

## Commands

Setup penuh:

```bash
npm run dev:setup
```

Reseed tanpa reset database:

```bash
npm run dev:seed:bidan
```

Reset database lalu seed ulang:

```bash
npm run dev:db:reset
```

Browser E2E:

```bash
npm run e2e
npm run e2e:smoke
npm run e2e:journey
```

Journey artefacts:

- `artifacts/journeys/latest/index.json`
- `artifacts/journeys/latest/**/screenshots/*.png`
- `artifacts/playwright-report/latest/index.html`

Catatan:

- Playwright web server memakai jalur `npm run dev:e2e` yang memaksa frontend Next berjalan di mode webpack agar route modular yang berat lebih stabil saat journey dijalankan.

## Seeded Credentials

Viewer password:

- `BidanDemo#2026`

Viewer accounts:

- customer: `+628111111001`
- approved professional: `+628111111002`
- submitted professional: `+628111111003`
- draft professional: `+628111111004`

Admin password:

- `AdminDemo#2026`

Admin emails:

- `naya@ops.bidanapp.id`
- `rani@ops.bidanapp.id`
- `dimas@ops.bidanapp.id`
- `vina@ops.bidanapp.id`

## Seeded Data Pack

Platform:

- active platform registry row untuk `bidan`

Professional:

- approved professional storefront
- submitted application waiting review
- draft application
- uploaded documents nyata
- portfolio, credentials, stories, coverage, availability, notification preferences
- nama, headline, bio, education history, dan notes yang lebih panjang untuk stress test UI realistis

Commerce:

- offerings untuk:
  - `home_visit`
  - `online_session`
  - `digital_product`
- orders di beberapa status
- payments, refunds, dan payouts terkait

Conversation and support:

- pre-order conversation thread
- order-linked thread
- support tickets `new`, `triaged`, `resolved`
- order notes, support subject/detail, fulfillment notes, dan public/admin notes dengan copy multi-baris yang lebih realistis

## Minimum QA Scenarios

Customer:

1. login sebagai customer
2. buka `/id/orders`
3. buat order dari seeded offering
4. simulasikan payment
5. buka order detail
6. buat support ticket

Professional:

1. login sebagai submitted professional
2. cek state onboarding dan dokumen
3. login sebagai approved professional
4. cek dashboard, offerings, dan publish gating

Admin:

1. login di admin
2. buka queue professional review
3. buka orders, support, refunds, payouts
4. buka dokumen seeded dari review flow

## Smoke Expectations

`npm run dev:smoke` mengasumsikan hal berikut:

- customer demo dapat membaca order timeline
- approved professional muncul di directory
- submitted professional tidak muncul di directory publik
- submitted professional muncul di admin review queue
- session viewer yang sama terbaca di route account native `bidan`

`npm run e2e:smoke` memverifikasi:

- customer login dari `bidan`
- account security native di `bidan`
- create order dan simulasi payment lokal

`npm run e2e:journey` memverifikasi:

- journey public, auth, customer, support, payments, professional, dan admin
- screenshot full-page per langkah journey untuk audit UI
- artefak report HTML yang siap dipakai untuk checklist manual dan handoff review
