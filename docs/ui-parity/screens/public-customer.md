# Public And Customer Surface

## Source of truth

- `HomeScreen`
- `ExploreScreen`
- `ServicesScreen`
- `ServiceDetailScreen`
- `AppointmentsScreen`
- `ProfileScreen`
- `NotificationsScreen`

## Checklist

- shell mobile `400px` dan floating bottom nav gelap
- section spacing padat, bukan layout dashboard longgar
- service dan professional cards mengikuti density lama
- activity tetap route `/orders`, tetapi ritme terasa seperti `AppointmentsScreen`
- profile, support, dan notifications memakai primitives lama

## Flow checks

- onboarding -> home
- explore -> professional detail
- services -> service detail
- service/professional detail -> order flow
- orders -> payment -> follow-up
- profile -> security / support
- notifications -> order/support context
