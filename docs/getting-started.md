# Getting Started

## Tujuan

Dokumen ini adalah jalur tercepat untuk menyalakan workspace Bidan secara lokal dan langsung masuk ke flow QA dengan seeded data.

## Current Truth

Repo aktif menjalankan:

- `apps/backend`
- `apps/bidan`
- `apps/admin`

SSO lokal memakai sibling subdomain `*.lvh.me`, jadi jangan uji auth lintas app lewat `localhost`.

## First Setup

```bash
npm install
npm run dev:setup
```

`npm run dev:setup` akan:

- membuat `.env` yang belum ada dari `.env.example`
- validasi env contract lokal
- menyalakan PostgreSQL dan Redis lokal bila dibutuhkan
- apply migration backend
- menjalankan Bidan demo seed

Setelah itu:

```bash
npm run dev
```

## Local URLs

- Bidan app: `http://bidan.lvh.me:3002/id`
- Bidan account security: `http://bidan.lvh.me:3002/id/security`
- Bidan device sessions: `http://bidan.lvh.me:3002/id/sessions`
- Admin app: `http://admin.lvh.me:3005/overview`
- Backend health: `http://api.lvh.me:8080/api/v1/health`
- Backend docs: `http://api.lvh.me:8080/api/v1/docs`

Useful pages:

- `http://bidan.lvh.me:3002/id/login`
- `http://bidan.lvh.me:3002/id/register`
- `http://bidan.lvh.me:3002/id/explore`
- `http://bidan.lvh.me:3002/id/services`
- `http://bidan.lvh.me:3002/id/orders`
- `http://bidan.lvh.me:3002/id/security`
- `http://bidan.lvh.me:3002/id/sessions`
- `http://bidan.lvh.me:3002/id/professionals/apply`
- `http://bidan.lvh.me:3002/id/professionals/dashboard`
- `http://admin.lvh.me:3005/login`

## Demo Credentials

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

## Daily Commands

```bash
npm run dev
npm run dev:doctor
npm run dev:db:reset
npm run dev:seed:bidan
npm run dev:smoke
npm run env:sync
npm run platform:scaffold -- therapist 3011
```

Validation commands:

```bash
npm run contract:generate
npm run boundary:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e:install
npm run e2e:smoke
npm run e2e:journey
npm run journey:open
```

## Daily Workflow

1. Jalankan `npm run dev`.
2. Login sebagai customer, professional, atau admin menggunakan seeded account.
3. Jika data demo perlu dikembalikan ke baseline, jalankan `npm run dev:seed:bidan`.
4. Jika schema lokal rusak atau drift, jalankan `npm run dev:db:reset`.
5. Sebelum merge, jalankan validation commands.
6. Untuk browser-level verification, jalankan `npm run e2e` atau `npm run e2e:smoke`.
7. Untuk visual proof browser-level, jalankan `npm run e2e:journey` lalu buka `npm run journey:open`.

## Reusable Vertical Setup

Jika nanti ingin membuka vertical baru, jangan copy-paste screen lama.

Flow yang benar:

1. Jalankan `npm run platform:scaffold -- <slug> <port>`.
2. Tambahkan entry manifest dan domain.
3. Sambungkan copy, theme preset, feature flags, dan professional attribute schema.
4. Reuse screen graph dan business logic yang sudah ada dari `@marketplace/web` dan `@marketplace/marketplace-core`.

## Quick QA Start

- Customer:
  login di `bidan`, buka `/id/orders`, buat order dari seeded offering, lalu cek order detail dan support.
- Professional:
  login sebagai approved atau submitted professional, lalu buka dashboard dan apply flow.
- Admin:
  login di `/login`, buka queue professional review, orders, support, refunds, dan payouts.

## Troubleshooting Singkat

- Jika env mismatch, jalankan `npm run dev:doctor`.
- Jika smoke gagal, jalankan `npm run dev:smoke` lalu lihat detail error.
- Jika DB drift, pakai `npm run dev:db:reset`.
- Jika perlu visual proof step-by-step berbasis screenshot, video, dan trace, lihat [Journeys](./journeys/README.md).
- Jika perlu panduan lebih detail, lihat [Local Runtime Troubleshooting](./local-runtime-troubleshooting.md).
