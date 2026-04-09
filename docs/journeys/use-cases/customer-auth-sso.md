# Customer Login And Native Account Security

## Tujuan

Membuktikan bahwa login native Bidan langsung membuka account state yang sama di route keamanan dan device sessions tanpa pindah ke app lain.

## Seed actor

- Customer demo: `+628111111001`

## Preconditions

- runtime lokal aktif di `*.lvh.me`
- route account native aktif di `bidan.lvh.me`

## Step summary

1. Buka layar login Bidan.
2. Login dengan akun customer seeded.
3. Buka halaman keamanan akun di Bidan.
4. Buat device kedua.
5. Logout device lain.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-auth-sso/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-auth-sso/journey.json)

## Known assertions

- redirect ke `/id/home`
- akun yang sama terbaca di `/id/security`
- daftar device aktif tampil
- logout device lain tidak memutus session saat ini
