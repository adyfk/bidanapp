# Environment

## Tujuan

Dokumen ini menjelaskan env contract yang dibutuhkan untuk menyalakan runtime Bidan lokal dan menyiapkannya untuk hardening production.

## Current Truth

Local runtime aktif:

- backend di `api.lvh.me:8080`
- bidan di `bidan.lvh.me:3002`
- admin di `admin.lvh.me:3005`

## Backend Env

Buat env lokal dengan:

```bash
npm run dev:setup
```

Key utama backend:

- `APP_ENV`
- `HTTP_HOST`
- `HTTP_PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ALLOWED_ORIGINS`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_PATH`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`
- `VIEWER_AUTH_COOKIE_NAME`
- `ADMIN_AUTH_COOKIE_NAME`
- `VIEWER_AUTH_SESSION_TTL`
- `ADMIN_AUTH_SESSION_TTL`
- `ADMIN_CONSOLE_CREDENTIALS_JSON`
- `ASSET_STORAGE_DIR`
- `PAYMENT_PROVIDER`
- `PAYMENT_CURRENCY`
- `XENDIT_SECRET_KEY`
- `XENDIT_WEBHOOK_TOKEN`

Default local browser origins:

```text
http://bidan.lvh.me:3002,http://admin.lvh.me:3005
```

## Frontend Env

Setiap app memakai `.env` kecil masing-masing:

- `apps/bidan/.env`
- `apps/admin/.env`

Key umum frontend:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`

Gunakan `npm run env:sync` untuk menambahkan key yang belum ada tanpa overwrite value yang sudah Anda set.

## Cookie Model

Viewer auth dan admin auth memakai dua cookie family terpisah:

- `VIEWER_AUTH_COOKIE_NAME` untuk customer dan professional surfaces
- `ADMIN_AUTH_COOKIE_NAME` untuk admin

Kontrak lokal:

- `AUTH_COOKIE_DOMAIN=.lvh.me`
- `AUTH_COOKIE_PATH=/`
- `AUTH_COOKIE_SAME_SITE=Lax`

Kontrak production:

- gunakan parent domain yang sama untuk `auth`, `bidan`, dan sibling subdomains lain jika nanti diaktifkan lagi
- set `AUTH_COOKIE_SECURE=true`

## Auth Shape

- `bidan` punya native routes untuk login, register, forgot-password, security, dan sessions.
- Semua route auth customer-facing menulis ke one shared viewer auth core di backend.
- Logout current session berlaku lintas sibling subdomains.

## Local Runtime Flow

- `npm run dev:setup`
  membuat env, memastikan infra, apply migration, lalu seed Bidan demo data
- `npm run dev`
  validasi env, cek infra, apply migration jika perlu, lalu start backend, bidan, dan admin
- `npm run dev:doctor`
  diagnosis env, infra, migration, dan port tanpa mutasi
- `npm run dev:smoke`
  verifikasi readiness runtime dan seeded flows
- `npm run dev:db:reset`
  reset schema lokal dan isi kembali demo seed

## Asset Storage

- `ASSET_STORAGE_DIR` menentukan root untuk dokumen professional
- default lokal berada di `apps/backend/storage`
- metadata dokumen disimpan di `professional_documents`

## Payment And SMS Defaults

Untuk local verification:

- `PAYMENT_PROVIDER=manual_test`
- `SMS_PROVIDER=console`

Untuk production hardening nanti:

- payment pindah ke `xendit`
- SMS challenge pindah ke provider nyata
