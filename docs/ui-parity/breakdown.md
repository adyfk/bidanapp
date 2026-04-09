# UI Parity Breakdown

Dokumen ini merangkum legacy source, route aktif, owner aktif, dan proof journey untuk seluruh surface Bidan yang sudah dipulihkan.

## Acceptance artifact

- [matrix](/Users/adi/Code/startup/bidanapp/docs/ui-parity/matrix.md)
- [latest Playwright report](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- [latest journey index](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/index.json)

## Route-by-route map

| Surface | Legacy source | Route aktif | Current owner | Proof utama |
| --- | --- | --- | --- | --- |
| Onboarding | `OnboardingScreen` | `/{locale}` | `packages/web/src/screens/public/onboarding/view.tsx` | `public-visitor-browse` |
| Customer access | `CustomerAccessScreen` | `/{locale}/login`, `/{locale}/register`, `/{locale}/forgot-password` | `packages/web/src/screens/auth/shared/viewer-auth-page.tsx` | `customer-auth-sso`, `customer-register-success`, `customer-invalid-login`, `customer-password-recovery` |
| Home | `HomeScreen` | `/{locale}/home` | `packages/web/src/screens/public/home/view.tsx` | `customer-home-profile-notifications`, `public-visitor-browse` |
| Explore | `ExploreScreen` | `/{locale}/explore` | `packages/web/src/screens/public/explore/view.tsx` | `public-visitor-browse` |
| Services | `ServicesScreen` | `/{locale}/services` | `packages/web/src/screens/public/services/view.tsx` | `public-visitor-browse` |
| Service detail | `ServiceDetailScreen` | `/{locale}/s/[slug]` | `packages/web/src/screens/public/service-detail/view.tsx` | `public-visitor-browse` |
| Professional detail | `ProfessionalDetailScreen` | `/{locale}/p/[slug]` | `packages/web/src/screens/public/professional-detail/view.tsx` | `public-visitor-browse` |
| Orders / activity | `AppointmentsScreen` | `/{locale}/orders` | `packages/web/src/screens/customer/orders-list/view.tsx` | `customer-order-payment` |
| Order detail / chat | `AppointmentDetailSheet` + `ChatScreen` | `/{locale}/orders/[orderId]` | `packages/web/src/screens/customer/order-detail/view.tsx` | `customer-order-payment` |
| Profile | `ProfileScreen` | `/{locale}/profile` | `packages/web/src/screens/customer/profile/view.tsx` | `customer-home-profile-notifications` |
| Notifications | `NotificationsScreen` | `/{locale}/notifications` | `packages/web/src/screens/customer/notifications/view.tsx` | `customer-home-profile-notifications` |
| Support | profile/support primitives | `/{locale}/support` | `packages/web/src/screens/customer/support/view.tsx` | `customer-support-ticket` |
| Professional apply | `ProfessionalAccessScreen` | `/{locale}/professionals/apply` | `packages/web/src/screens/professional/apply/view.tsx` | `professional-draft-apply-state`, `professional-apply-review-state` |
| Professional workspace | `ProfessionalDashboardShell` | `/{locale}/professionals/dashboard/*` | `packages/web/src/screens/professional/workspace/view.tsx` | `professional-workspace-approved`, `professional-submitted-offerings-gated` |
| Workspace profile | `ProfessionalProfileScreen` | `/{locale}/professionals/dashboard/profile` | `packages/web/src/screens/professional/workspace/sections/profile.tsx` | `professional-workspace-approved` |
| Admin login | `AdminLoginScreen` | `/login` pada host admin | `packages/web/src/screens/admin/parts/login-shell.tsx` | `admin-login-overview` |
| Admin console | `AdminConsoleShell` + modules | `/overview`, `/professionals`, `/orders`, `/support`, `/refunds`, `/payouts`, `/studio` | `packages/web/src/screens/admin/view.tsx` | `admin-console-route-map`, `admin-review-queue`, `admin-support-triage`, `admin-refund-payout` |

## Absorbed legacy flows

- `ChatScreen` lama diserap ke `/{locale}/orders/[orderId]` agar detail order, chat, payment, review, dan support tetap hidup di satu alur.
- `ProfessionalProfileScreen` lama diserap ke `/{locale}/professionals/dashboard/profile` agar profile parity tetap hidup tanpa menambah route baru.

## Final acceptance notes

- Setiap row di [matrix](/Users/adi/Code/startup/bidanapp/docs/ui-parity/matrix.md) harus tetap `matched`.
- Proof visual resmi tetap berasal dari [latest Playwright report](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html).
- Journey di bawah `artifacts/journeys/latest/*` menjadi bukti route-by-route untuk flow utama yang sudah dipulihkan.
