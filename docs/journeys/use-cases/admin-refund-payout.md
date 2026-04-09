# Admin Refund And Payout

## Tujuan

Membuktikan bahwa refund dan payout bisa dioperasikan dari seeded quick pick tanpa raw manual ID.

## Seed actor

- Admin demo: `rani@ops.bidanapp.id`

## Preconditions

- seeded orders tersedia untuk refund
- seeded payout tersedia di queue

## Step summary

1. Login admin.
2. Buka refunds.
3. Buat refund baru.
4. Buka payouts.
5. Majukan payout seeded ke `processing`.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/admin-refund-payout/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/admin-refund-payout/journey.json)

## Known assertions

- quick pick order bekerja
- refund record baru muncul
- payout seeded bisa dipajukan ke `processing`
