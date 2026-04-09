# Admin Console Route Coverage

## Tujuan

Membuktikan bahwa route admin yang belum tercakup oleh journey mutasi tetap bisa dibuka dan memuat seeded desk yang benar.

## Seed actor

- Admin demo: `rani@ops.bidanapp.id`

## Preconditions

- admin console aktif

## Step summary

1. Login admin.
2. Buka customers desk.
3. Buka orders desk.
4. Buka studio snapshot.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/admin-console-route-map/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/admin-console-route-map/journey.json)

## Known assertions

- customers desk tampil
- orders desk tampil
- studio snapshot tampil
