# Customer Native Register Flow

## Tujuan

Membuktikan bahwa customer baru dapat mendaftar langsung dari layar native Bidan lalu masuk ke home authenticated.

## Seed actor

- Visitor baru dengan nomor unik per run

## Preconditions

- runtime lokal aktif
- nomor ponsel yang dipakai belum terdaftar

## Step summary

1. Buka `/id/register`.
2. Isi nama, nomor, kota, dan password.
3. Submit register.
4. Verifikasi redirect ke `/id`.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-register-success/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-register-success/journey.json)

## Known assertions

- form register tampil lengkap
- akun baru berhasil dibuat
- redirect ke home berhasil
