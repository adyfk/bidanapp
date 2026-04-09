# Customer Invalid Login Guard

## Tujuan

Membuktikan bahwa password yang salah tetap mempertahankan user di layar login dan menampilkan pesan yang ramah.

## Seed actor

- Customer demo: `+628111111001`

## Preconditions

- akun seeded customer tersedia

## Step summary

1. Buka `/id/login`.
2. Isi nomor customer dengan password yang salah.
3. Submit login.
4. Verifikasi banner error dan URL tetap di login.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-invalid-login/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-invalid-login/journey.json)

## Known assertions

- login ditolak
- user tetap di layar login
- error message bersifat customer-friendly
