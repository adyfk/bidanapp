# Visitor Public Browsing Flow

## Tujuan

Membuktikan bahwa visitor dapat bergerak dari onboarding ke home publik, explore, professional detail, services, dan service detail tanpa login.

## Seed actor

- Visitor tanpa akun

## Preconditions

- approved professional seeded tampil di katalog publik
- seeded offerings publik tersedia

## Step summary

1. Buka onboarding `/id`.
2. Pilih jalur visitor.
3. Buka explore.
4. Buka detail profesional.
5. Buka services.
6. Buka detail layanan.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/public-visitor-browse/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/public-visitor-browse/journey.json)

## Known assertions

- onboarding access-first tampil
- home publik tampil tanpa login
- route explore, professional detail, services, dan service detail bisa dibuka
