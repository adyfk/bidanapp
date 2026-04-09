# Backend

## Tujuan

Dokumen ini merangkum backend Bidan V2, route penting, dan workflow lokal yang paling sering dipakai engineer.

## Current Truth

Backend berjalan sebagai one Go modular monolith di `api.xxx.id`.

Module aktif:

- `health`
- `viewerauth`
- `adminauth`
- `platformregistry`
- `professionalonboarding`
- `professionalworkspace`
- `directory`
- `offerings`
- `orders`
- `adminreview`
- `adminops`
- `chat`
- `support`
- `notifications`

## Core Design

- one PostgreSQL database
- one global viewer auth source: `auth_users`, `auth_identities`, `auth_sessions`
- one global customer profile table
- platform-scoped professional profile, application, document, dan workspace data
- commerce dan ops bertumpu pada `offerings`, `orders`, `payments`, `refunds`, dan `payouts`

## Important Routes

Viewer auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/session`
- `DELETE /api/v1/auth/session`
- `GET /api/v1/auth/sessions`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`

Platform routes:

- `GET /api/v1/platforms`
- `GET /api/v1/platforms/{platform_id}`
- `GET /api/v1/platforms/{platform_id}/professional-schema`
- `GET /api/v1/platforms/{platform_id}/directory/professionals`
- `GET /api/v1/platforms/{platform_id}/directory/offerings`
- `GET|PUT /api/v1/platforms/{platform_id}/professionals/me/onboarding`
- `GET|PUT /api/v1/platforms/{platform_id}/professionals/me/workspace/*`
- `GET|POST /api/v1/platforms/{platform_id}/professionals/me/offerings`
- `GET|POST /api/v1/platforms/{platform_id}/customers/me/orders`
- `POST /api/v1/orders/{order_id}/payments/session`
- `POST /api/v1/webhooks/payments/{provider}`

Admin routes:

- `POST /api/v1/admin/auth/session`
- `GET /api/v1/admin/platforms/{platform_id}/professional-applications`
- `GET /api/v1/admin/platforms/{platform_id}/orders`
- `GET /api/v1/admin/platforms/{platform_id}/support/tickets`
- `GET /api/v1/admin/platforms/{platform_id}/refunds`
- `GET /api/v1/admin/platforms/{platform_id}/payouts`

## Local Workflow

Untuk kerja harian:

```bash
npm run dev:setup
npm run dev
```

Untuk database:

```bash
npm run atlas:status --workspace @marketplace/backend
npm run atlas:apply --workspace @marketplace/backend
npm run atlas:migrate:hash --workspace @marketplace/backend
```

Kalau schema lokal drift:

```bash
npm run dev:db:reset
```

Kalau hanya perlu mengembalikan demo data:

```bash
npm run dev:seed:bidan
```

## Seeded Readiness

Backend lokal diharapkan selalu bisa menjawab seeded checks berikut:

- customer demo bisa baca order timeline
- approved professional muncul di directory
- submitted professional muncul di admin review queue
- shared viewer session berlaku lintas `auth` dan `bidan`

Gunakan `npm run dev:smoke` untuk memverifikasi ini.
