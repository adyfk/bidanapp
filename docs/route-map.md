# Route Map

## Tujuan

Dokumen ini adalah peta route aktif untuk `bidan` dan `admin`.

## Locale Rules

Platform-facing apps memakai locale prefix:

- `/` redirect ke `/{defaultLocale}`
- locale aktif saat ini: `id` dan `en`
- default locale: `id`

## Bidan

Public and customer routes:

- `/{locale}`
- `/{locale}/login`
- `/{locale}/register`
- `/{locale}/forgot-password`
- `/{locale}/security`
- `/{locale}/sessions`
- `/{locale}/explore`
- `/{locale}/services`
- `/{locale}/p/[slug]`
- `/{locale}/s/[slug]`
- `/{locale}/orders`
- `/{locale}/orders/[orderId]`
- `/{locale}/profile`
- `/{locale}/notifications`
- `/{locale}/support`

Legacy parity notes:

- `/{locale}/orders/[orderId]` menyerap rasa `AppointmentDetailSheet` dan `ChatScreen` lama.
- `/{locale}/profile` mempertahankan sheet flow lama untuk edit profil, keamanan, dan support.

Professional routes:

- `/{locale}/professionals/apply`
- `/{locale}/professionals/dashboard`
- `/{locale}/professionals/dashboard/orders`
- `/{locale}/professionals/dashboard/offerings`
- `/{locale}/professionals/dashboard/portfolio`
- `/{locale}/professionals/dashboard/trust`
- `/{locale}/professionals/dashboard/coverage`
- `/{locale}/professionals/dashboard/availability`
- `/{locale}/professionals/dashboard/notifications`
- `/{locale}/professionals/dashboard/profile`

Legacy parity notes:

- `/{locale}/professionals/dashboard/profile` adalah lokasi parity untuk `ProfessionalProfileScreen` lama.

## Admin

- `/` redirect ke `/overview`
- `/login`
- `/overview`
- `/customers`
- `/professionals`
- `/orders`
- `/support`
- `/refunds`
- `/payouts`
- `/studio`

## QA Routes

Route yang paling sering dipakai saat seeded QA:

- `http://bidan.lvh.me:3002/id/login`
- `http://bidan.lvh.me:3002/id/security`
- `http://bidan.lvh.me:3002/id/sessions`
- `http://bidan.lvh.me:3002/id/orders`
- `http://bidan.lvh.me:3002/id/professionals/apply`
- `http://bidan.lvh.me:3002/id/professionals/dashboard`
- `http://admin.lvh.me:3005/professionals`
