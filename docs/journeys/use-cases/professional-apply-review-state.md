# Submitted Professional Review State

## Tujuan

Membuktikan bahwa professional yang sudah submit aplikasi melihat state review yang jelas di apply flow.

## Seed actor

- Submitted professional demo: `+628111111003`

## Preconditions

- aplikasi professional seeded berada di state `submitted` atau `pending_review`

## Step summary

1. Login sebagai submitted professional.
2. Buka halaman apply.
3. Verifikasi state review.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/professional-apply-review-state/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/professional-apply-review-state/journey.json)

## Known assertions

- `Status aplikasi` tampil
- status `submitted` atau `pending_review` terlihat jelas
