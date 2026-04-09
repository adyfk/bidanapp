# Approved Professional Workspace

## Tujuan

Membuktikan bahwa professional approved dapat membuka workspace, mempublish offering baru, lalu berpindah ke seluruh section dashboard utama.

## Seed actor

- Approved professional demo: `+628111111002`

## Preconditions

- profile dan application professional sudah approved
- workspace seeded tersedia

## Step summary

1. Login sebagai approved professional.
2. Buka dashboard overview.
3. Buka section offerings.
4. Publish offering baru.
5. Buka section orders, portfolio, trust, coverage, availability, notifications, dan profile.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/professional-workspace-approved/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/professional-workspace-approved/journey.json)

## Known assertions

- workspace overview memuat snapshot seeded
- form publish aktif untuk akun approved
- offering baru muncul di daftar
- semua section utama dashboard dapat dibuka
