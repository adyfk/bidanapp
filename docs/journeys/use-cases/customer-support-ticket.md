# Customer Support Ticket

## Tujuan

Membuktikan bahwa customer dapat membuat tiket baru, tiket itu langsung masuk ke antrean pribadi, lalu state-nya ikut berubah setelah admin melakukan triage.

## Seed actor

- Customer demo: `+628111111001`
- Admin demo: `rani@ops.bidanapp.id`

## Preconditions

- support module aktif
- customer dan admin bisa login pada runtime yang sama

## Step summary

1. Customer buka support center.
2. Customer buat tiket baru.
3. Customer melihat tiket di antrean pribadi.
4. Admin triage tiket.
5. Customer melihat state tiket yang diperbarui.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-support-ticket/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-support-ticket/journey.json)

## Known assertions

- form tiket tampil
- tiket baru berhasil dibuat
- tiket muncul di queue customer
- triage admin tercermin di sisi customer
