# Admin Login Overview

## Tujuan

Membuktikan bahwa admin seeded bisa login dan langsung masuk ke overview operasi dengan metrik seeded yang bermakna.

## Seed actor

- Admin demo: `rani@ops.bidanapp.id`

## Preconditions

- admin app aktif di `admin.lvh.me`

## Step summary

1. Buka login admin.
2. Login dengan akun seeded.
3. Verifikasi overview.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/admin-login-overview/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/admin-login-overview/journey.json)

## Known assertions

- redirect ke `/overview`
- overview menampilkan seeded stats
