# Orders And Activity

## Source of truth

- `AppointmentsScreen`
- `AppointmentsHeader`
- `AppointmentsTabs`
- `AppointmentsStatusFilters`
- `AppointmentDetailSheet`
- `AppointmentCancelSheet`
- `AppointmentChatSheet`
- `AppointmentReviewSheet`
- `ChatScreen`

## Current owner

- `packages/web/src/screens/customer/orders-list/view.tsx`
- `packages/web/src/screens/customer/order-detail/view.tsx`

## Section checklist

- header aktivitas
- segmented tabs `Berjalan / Riwayat`
- filter status
- search field
- list kartu aktivitas
- detail state dan payment/follow-up state
- detail/chat sheet rhythm
- composer chat di bagian bawah

## Flow checklist

- visitor diarahkan ke akses customer
- customer melihat aktivitas aktif dan riwayat
- customer membuka detail order
- customer mengirim pesan dari detail order
- customer lanjut ke pembayaran lokal
- customer lanjut ke support atau tindak lanjut

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/AppointmentsScreen.tsx`
- `bidanapp copy/apps/frontend/src/components/screens/ChatScreen.tsx`

## Final acceptance notes

- `/orders` tetap canonical, tetapi hierarchy, tab, filter, dan list rhythm sekarang mengikuti `AppointmentsScreen` lama.
- Detail/chat sudah diserap ke `/orders/[orderId]` tanpa menghidupkan route chat baru.
- Payment follow-up, support, dan order-linked chat sekarang kembali terasa seperti family activity lama.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
