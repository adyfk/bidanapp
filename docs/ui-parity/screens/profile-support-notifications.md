# Profile, Support, And Notifications

## Source of truth

- `ProfileScreen`
- `NotificationsScreen`
- profile/support primitives lama
- `ProfileSupportCenter`

## Current owner

- `packages/web/src/screens/customer/profile/view.tsx`
- `packages/web/src/screens/customer/notifications/view.tsx`
- `packages/web/src/screens/customer/support/view.tsx`

## Section checklist

- identity card
- quick actions
- support entry
- settings card dan security entry
- account/security/support sheet
- grouped notifications
- support ticket create + follow-up list

## Flow checklist

- profile -> orders
- profile -> explore
- profile -> security
- profile -> support
- notifications -> order/support context
- support -> ticket create -> ticket update

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/ProfileScreen.tsx`
- `bidanapp copy/apps/frontend/src/components/screens/NotificationsScreen.tsx`

## Final acceptance notes

- Profile kembali ke identity, quick actions, support entry, settings, professional path, dan logout family lama.
- Notifications kembali ke grouping dan CTA context lama.
- Support center kembali ke alur create dan follow-up yang bisa dipakai product review tanpa terasa utilitarian.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
