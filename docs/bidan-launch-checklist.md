# Bidan Launch Checklist

## Tujuan

Checklist ini dipakai untuk mengecek kesiapan Bidan sebelum demo besar, QA pass, atau production hardening berikutnya.

## Runtime

- manifest aktif menunjuk ke `bidan`
- `auth`, `bidan`, `admin`, dan `backend` bisa start normal
- local URLs dan production origins sudah sesuai env

## Auth

- native login/register/forgot-password di `bidan` berjalan
- native account tools `/id/sessions` dan `/id/security` di `bidan` berjalan
- shared viewer session sinkron di seluruh surface viewer
- logout current session berlaku lintas subdomain

## Public And Customer

- home, explore, services, professional detail, dan offering detail render
- directory hanya menampilkan approved professionals dan published offerings
- orders page bisa membuat order dari seeded offerings
- order detail bisa membuka chat dan support flow
- profile dan notifications page load

## Professional

- apply flow bisa upload dokumen nyata
- submitted, draft, dan approved state terlihat jelas di UI
- dashboard sections menyimpan data dengan benar
- publish offering hanya aktif untuk approved professional

## Admin

- login admin bekerja dengan seeded credentials
- professional review queue terisi
- orders, support, refunds, payouts, dan studio load dengan meaningful data
- admin bisa membuka dokumen review

## Validation Commands

- `npm run contract:generate`
- `npm run boundary:check`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run dev:smoke`

## Remaining Before Production

- real Xendit integration
- real SMS OTP provider
- audit log dan observability yang lebih matang
- finance automation yang lebih lengkap
