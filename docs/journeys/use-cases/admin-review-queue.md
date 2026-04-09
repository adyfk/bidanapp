# Admin Professional Review Queue

## Tujuan

Membuktikan bahwa admin bisa membuka antrean review profesional seeded dan melihat dokumen serta CTA review yang relevan.

## Seed actor

- Admin demo: `rani@ops.bidanapp.id`

## Preconditions

- submitted professional seeded masih ada di antrean review

## Step summary

1. Login admin.
2. Buka section professionals.
3. Tinjau card application, dokumen, dan CTA review.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/admin-review-queue/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/admin-review-queue/journey.json)

## Known assertions

- queue memuat data seeded
- CTA approve / reject / request changes tampil
- link dokumen review terlihat
