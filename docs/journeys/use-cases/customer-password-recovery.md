# Customer Password Recovery Request

## Tujuan

Membuktikan bahwa flow forgot password masuk ke state OTP challenge dari UI native Bidan.

## Seed actor

- Customer demo: `+628111111001`

## Preconditions

- `SMS_PROVIDER=console`
- route `/id/forgot-password` aktif

## Step summary

1. Buka layar forgot password.
2. Kirim OTP ke nomor customer seeded.
3. Pastikan challenge id dan masked destination tampil.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-password-recovery/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-password-recovery/journey.json)

## Known assertions

- tombol `Kirim OTP` tersedia
- state form berpindah ke OTP challenge
- masked destination tampil
