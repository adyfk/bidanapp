# Payment Manual Test

## Tujuan

Dokumen ini menjelaskan cara menguji flow payment Bidan secara lokal dengan provider `manual_test`.

## Current Truth

Commerce Bidan sudah memakai:

- order creation
- payment session creation
- webhook-shaped settlement

Provider lokal saat ini:

- `PAYMENT_PROVIDER=manual_test`

## Flow

1. Customer membuat order dari seeded offering di `/id/orders`
2. Backend menyimpan order sebagai:
   - `status=pending_payment`
   - `payment_status=pending`
3. Frontend meminta `POST /orders/{order_id}/payments/session`
4. Backend membuat row `payments` dan mengembalikan session payload
5. Local verification mensimulasikan settlement lewat jalur webhook/provider flow yang tersedia
6. Order dan payment status berubah dari flow formal itu, bukan langsung saat order dibuat

## Seeded QA Use

Untuk seeded QA:

- login sebagai customer `+628111111001`
- pilih seeded offering dari orders page
- buat order
- simulasikan payment
- cek order detail, payment status, chat, dan support linkage

Seeder juga menyediakan contoh order dalam beberapa status:

- `pending_payment`
- `pending_fulfillment`
- `completed`
- `refunded`

## Kenapa Flow Ini Penting

- order tidak pernah auto-paid saat create
- transisi payment tetap mengikuti state machine
- penggantian ke Xendit nanti tidak perlu mengubah domain model utama

## Next Production Step

Saat pindah ke Xendit:

- endpoint payment session tetap sama
- implementasi provider internals diganti
- webhook verification dan provider reference dipersist
