# Visitor Public Browsing Flow

## Tujuan

Membuktikan bahwa visitor dapat bergerak dari home publik langsung di `/id`, lalu lanjut ke explore, professional detail, services, dan service detail tanpa login.

## Seed actor

- Visitor tanpa akun

## Preconditions

- approved professional seeded tampil di katalog publik
- seeded offerings publik tersedia

## Step summary

1. Buka root public home `/id`.
2. Buka explore.
3. Buka detail profesional.
4. Buka services.
5. Buka detail layanan.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/public-visitor-browse/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/public-visitor-browse/journey.json)

## Known assertions

- home publik tampil langsung di root locale
- route home lama tidak lagi merender home publik
- route explore, professional detail, services, dan service detail bisa dibuka
