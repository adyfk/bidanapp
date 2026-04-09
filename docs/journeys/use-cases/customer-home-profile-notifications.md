# Customer Home, Profile, And Notifications

## Tujuan

Membuktikan bahwa customer authenticated dapat membuka home, profile, dan notifications tanpa kehilangan context session.

## Seed actor

- Customer demo: `+628111111001`

## Preconditions

- akun customer seeded tersedia

## Step summary

1. Login customer.
2. Verifikasi home authenticated.
3. Buka profile.
4. Buka notifications.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-home-profile-notifications/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-home-profile-notifications/journey.json)

## Known assertions

- home customer tampil
- profile customer tampil
- notifications feed tampil
