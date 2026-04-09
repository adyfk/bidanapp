# Order Detail And Chat

## Source of truth

- `AppointmentDetailSheet`
- `AppointmentChatSheet`
- `ChatScreen`

## Current owner

- `packages/web/src/screens/customer/order-detail/view.tsx`

## Legacy section order

- sticky white header
- professional contact card
- request/update strip
- order summary blocks
- chat thread
- bottom composer
- support/help follow-up

## Checklist

- professional context card tampil di atas fold
- status/payment strip terasa seperti detail lama
- bubble chat incoming/outgoing mengikuti rhythm lama
- composer selalu menempel di bawah
- support tetap bisa dibuat dari konteks order

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/ChatScreen.tsx`
- `bidanapp copy/apps/frontend/src/components/screens/AppointmentsScreen.tsx`

## Final acceptance notes

- Route detail tetap full page untuk deep link V2, tetapi seluruh primitives-nya sudah mengikuti sheet/chat rhythm lama.
- Header, contact block, status strip, bubble chat, composer bawah, dan support context kini menjadi owner visual utama untuk parity `ChatScreen`.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
