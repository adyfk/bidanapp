# BidanApp Engineering Handbook

BidanApp sekarang berjalan sebagai **Bidan-only marketplace workspace** dengan tiga surface utama:

- `apps/backend` untuk one shared Go API
- `apps/bidan` untuk public, customer, professional, dan account experience
- `apps/admin` untuk review dan operations

Shared foundation tetap ada di:

- `packages/platform-config`
- `packages/sdk`
- `packages/ui`
- `packages/web`

## Quick Start

```bash
npm install
npm run dev:setup
npm run dev
```

Local URLs:

- `http://bidan.lvh.me:3002/id`
- `http://bidan.lvh.me:3002/id/security`
- `http://bidan.lvh.me:3002/id/sessions`
- `http://admin.lvh.me:3005/overview`
- `http://api.lvh.me:8080/api/v1/health`
- `http://api.lvh.me:8080/api/v1/docs`

## Daily Commands

```bash
npm run dev
npm run dev:doctor
npm run dev:db:reset
npm run dev:seed:bidan
npm run dev:smoke
npm run e2e:smoke
npm run e2e:journey
npm run journey:open
npm run contract:generate
npm run boundary:check
npm run typecheck
npm run test
npm run build
```

## Demo Accounts

- Viewer password: `BidanDemo#2026`
- Customer: `+628111111001`
- Approved professional: `+628111111002`
- Submitted professional: `+628111111003`
- Draft professional: `+628111111004`
- Admin password: `AdminDemo#2026`
- Admin emails:
  - `naya@ops.bidanapp.id`
  - `rani@ops.bidanapp.id`
  - `dimas@ops.bidanapp.id`
  - `vina@ops.bidanapp.id`

## Repo Map

```text
apps/
  admin/       admin console
  backend/     modular monolith API
  bidan/       Bidan product surface
packages/
  platform-config/  manifest and theme config
  sdk/              generated API client and adapters
  ui/               design system
  web/              shared page containers
config/
  platform-manifest.json
docs/
  active engineering and ops handbook
```

Mulai dari [docs/README.md](/Users/adi/Code/startup/bidanapp/docs/README.md) untuk handbook lengkap, baca [docs/marketplace-concept.md](/Users/adi/Code/startup/bidanapp/docs/marketplace-concept.md) untuk konsep marketplace dari awal, lalu buka [docs/journeys/README.md](/Users/adi/Code/startup/bidanapp/docs/journeys/README.md) untuk pipeline visual proof berbasis Playwright dari seed sampai screenshot, video, dan trace per flow.
