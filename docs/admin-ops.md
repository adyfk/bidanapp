# Admin Ops

## Tujuan

Dokumen ini menjelaskan cara memakai admin console Bidan untuk review, operations, support, refunds, dan payouts menggunakan seeded dataset lokal.

## Active Sections

Admin console aktif memiliki:

- `overview`
- `customers`
- `professionals`
- `orders`
- `support`
- `refunds`
- `payouts`
- `studio`

## Seeded Admin Access

- login page: `http://admin.lvh.me:3005/login`
- admin password: `AdminDemo#2026`
- admin emails:
  - `naya@ops.bidanapp.id`
  - `rani@ops.bidanapp.id`
  - `dimas@ops.bidanapp.id`
  - `vina@ops.bidanapp.id`

## Seeded Data You Can Expect

- submitted professional di review queue:
  `Bidan Rahma Pertiwi`
- approved professional yang sudah bisa publish:
  `Bidan Nabila Lestari`
- seeded orders di beberapa status
- support tickets dengan status `new`, `triaged`, dan `resolved`
- refund dan payout records untuk manual verification

## Daily Ops Flows

Professional review:

- buka `/professionals`
- review application submitted
- approve, reject, atau request changes
- verifikasi bahwa publish eligibility ikut berubah

Orders ops:

- buka `/orders`
- lihat hubungan customer, professional, offering, dan payment
- gerakkan status sesuai flow ops yang tersedia di UI

Support desk:

- buka `/support`
- cek seeded tickets
- ubah status, assign admin, dan tambahkan note bila perlu

Refunds and payouts:

- buka `/refunds` atau `/payouts`
- gunakan seeded quick-picks untuk membuat atau memproses record tanpa menebak ID manual

## Current Boundaries

- finance actions masih manual untuk milestone ini
- audit log export belum ada
- pagination dan filtering lanjutan belum lengkap

## Verification

Sebelum demo atau QA:

```bash
npm run dev:seed:bidan
npm run dev:smoke
```
