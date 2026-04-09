# UI Parity Matrix

| Surface | Legacy source | Current owner | Layout | Recipes | Sections | Flow | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Onboarding | `OnboardingScreen` | `packages/web/src/screens/public/onboarding/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Customer access | `CustomerAccessScreen` | `packages/web/src/screens/auth/shared/viewer-auth-page.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Home | `HomeScreen` | `packages/web/src/screens/public/home/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Explore | `ExploreScreen` | `packages/web/src/screens/public/explore/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Services | `ServicesScreen` | `packages/web/src/screens/public/services/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Professional detail | `ProfessionalDetailScreen` | `packages/web/src/screens/public/professional-detail/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Service detail | `ServiceDetailScreen` | `packages/web/src/screens/public/service-detail/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Orders / activity | `AppointmentsScreen` | `packages/web/src/screens/customer/orders-list/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Order detail / chat | `AppointmentDetailSheet` + `ChatScreen` | `packages/web/src/screens/customer/order-detail/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Profile | `ProfileScreen` | `packages/web/src/screens/customer/profile/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Notifications | `NotificationsScreen` | `packages/web/src/screens/customer/notifications/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Support | profile/support primitives | `packages/web/src/screens/customer/support/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Professional apply | `ProfessionalAccessScreen` | `packages/web/src/screens/professional/apply/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Professional workspace | `ProfessionalDashboardShell` family | `packages/web/src/screens/professional/workspace/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Professional workspace profile | `ProfessionalProfileScreen` | `packages/web/src/screens/professional/workspace/sections/profile.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Admin login | `AdminLoginScreen` | `packages/web/src/screens/admin/parts/login-shell.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |
| Admin console | `AdminConsoleShell` + `AdminModuleScreens` | `packages/web/src/screens/admin/view.tsx` | `matched` | `matched` | `matched` | `matched` | `matched` |

## Absorbed legacy routes

- `ChatScreen` lama dipetakan ke `/{locale}/orders/[orderId]` dan ikut dinilai `matched` lewat row `Order detail / chat`.
- `ProfessionalProfileScreen` lama dipetakan ke `/{locale}/professionals/dashboard/profile` dan ikut dinilai `matched` lewat row `Professional workspace profile`.

## Acceptance notes

- Tidak ada row `partial` atau `missing`.
- Copy teknis dan filler yang mengganggu alur user sudah dipangkas dari surface utama.
- Latest Playwright report menjadi artefak proof utama untuk flow dan screenshot parity.
