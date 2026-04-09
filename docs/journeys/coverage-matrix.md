# Journey Coverage Matrix

Dokumen ini merangkum coverage resmi untuk Playwright-only journey proof.

## Public

- `public-visitor-browse`
- `localhost-lvh-redirect`

## Auth

- `customer-auth-sso`
- `customer-password-recovery`
- `customer-register-success`
- `customer-invalid-login`

## Customer

- `customer-home-profile-notifications`
- `customer-order-payment`
- `customer-support-ticket`

## Professional

- `professional-draft-apply-state`
- `professional-apply-review-state`
- `professional-submitted-offerings-gated`
- `professional-workspace-approved`

## Admin

- `admin-login-overview`
- `admin-review-queue`
- `admin-console-route-map`
- `admin-support-triage`
- `admin-refund-payout`

## Route coverage intent

Setiap route aktif harus minimal tersentuh oleh satu journey:

- public Bidan: onboarding, home, explore, services, professional detail, service detail
- auth and account routes di `bidan`: login, register, forgot-password, sessions, security
- customer: home, profile, notifications, orders, order detail, support
- professional: apply, dashboard overview, orders, offerings, portfolio, trust, coverage, availability, notifications, profile
- admin: login, overview, customers, orders, professionals, support, refunds, payouts, studio

## Mutation coverage intent

Mutasi penting yang harus tetap punya proof:

- login
- register
- logout other devices
- order create
- payment simulate
- order chat create/send
- support ticket create
- support triage
- offering publish
- refund create
- payout status update

## Guard and recovery intent

- localhost ke `.lvh.me`
- invalid login
- submitted professional publish gate
- submitted professional review state
