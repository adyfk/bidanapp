# Localhost Redirect Guard

## Tujuan

Membuktikan bahwa entry localhost otomatis diarahkan ke keluarga domain `.lvh.me` agar cookie dan CORS auth tetap sinkron.

## Seed actor

- Visitor lokal

## Preconditions

- proxy redirect lokal aktif

## Step summary

1. Buka `http://localhost:3002/id/login`.
2. Verifikasi browser diarahkan ke `http://bidan.lvh.me:3002/id/login`.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/localhost-lvh-redirect/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/localhost-lvh-redirect/journey.json)

## Known assertions

- localhost tidak dipakai untuk login aktif
- redirect ke `.lvh.me` terjadi otomatis
