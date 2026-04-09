# Admin Support Triage

## Tujuan

Membuktikan edge lintas role: customer membuat tiket, admin melihat tiket yang sama, lalu menjalankan triage dari support desk.

## Seed actor

- Customer demo: `+628111111001`
- Admin demo: `rani@ops.bidanapp.id`

## Preconditions

- support desk aktif
- customer dan admin dapat login pada runtime yang sama

## Step summary

1. Customer membuat tiket baru.
2. Admin login.
3. Admin membuka support desk.
4. Admin mengisi status dan catatan triage.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/admin-support-triage/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/admin-support-triage/journey.json)

## Known assertions

- tiket baru terlihat dari sisi admin
- triage tersimpan ke ticket
