# UI Screenshot Checklist

## Run Meta

- Tanggal validasi: `2026-04-10`
- Run id: `2026-04-10T02-55-11-105Z`
- Command: `npm run e2e:journey`
- Hasil: `18/18 use case passed`
- Jumlah screenshot step: `56`
- Artefak indeks: `artifacts/journeys/latest/index.json`
- Artefak report: `artifacts/playwright-report/latest/index.html`

## Seed Stress Notes

- Seed demo sekarang memakai nama customer dan professional yang lebih realistis, termasuk gelar, kota, headline, bio, dan education history yang panjang.
- Order notes, support ticket details, public notes, internal notes, dan fulfillment notes juga diperpanjang agar UI diuji pada copy multi-baris yang benar-benar hidup.
- Offering demo tetap kompatibel dengan regex E2E lama, tetapi deskripsi, metadata, dan status flow-nya sekarang lebih kaya.

## Coverage Summary

- `admin`: `3` use case
- `auth`: `5` use case
- `customer`: `1` use case
- `payments`: `2` use case
- `professional`: `4` use case
- `public`: `1` use case
- `support`: `2` use case

## Screenshot Checklist

### Public

- [x] Onboarding screen is ready — route `/id` — `artifacts/journeys/latest/public-visitor-browse/screenshots/01-onboarding-screen-is-ready.png`
- [x] Visitor enters the public home feed — route `/id/home` — `artifacts/journeys/latest/public-visitor-browse/screenshots/02-visitor-enters-the-public-home-feed.png`
- [x] Explore professionals is visible — route `/id/explore` — `artifacts/journeys/latest/public-visitor-browse/screenshots/03-explore-professionals-is-visible.png`
- [x] Professional detail page opens — route `/id/p/[slug]` — `artifacts/journeys/latest/public-visitor-browse/screenshots/04-professional-detail-page-opens.png`
- [x] Service catalog and detail page are reachable — route `/id/s/[slug]` — `artifacts/journeys/latest/public-visitor-browse/screenshots/05-service-catalog-and-detail-page-are-reachable.png`

### Auth

- [x] Login screen is ready — route `/id/login` — `artifacts/journeys/latest/customer-auth-sso/screenshots/01-login-screen-is-ready.png`
- [x] Customer signs in from Bidan — route `/id/home` — `artifacts/journeys/latest/customer-auth-sso/screenshots/02-customer-signs-in-from-bidan.png`
- [x] Native security screen resolves the signed-in account — route `/id/security` — `artifacts/journeys/latest/customer-auth-sso/screenshots/03-native-security-screen-resolves-the-signed-in-account.png`
- [x] Device sessions show multiple entries — route `/id/sessions` — `artifacts/journeys/latest/customer-auth-sso/screenshots/04-device-sessions-show-multiple-entries.png`
- [x] Customer logs out other devices — route `/id/sessions` — `artifacts/journeys/latest/customer-auth-sso/screenshots/05-customer-logs-out-other-devices.png`
- [x] Recovery screen is ready — route `/id/forgot-password` — `artifacts/journeys/latest/customer-password-recovery/screenshots/01-recovery-screen-is-ready.png`
- [x] OTP request starts the recovery challenge — route `/id/forgot-password` — `artifacts/journeys/latest/customer-password-recovery/screenshots/02-otp-request-starts-the-recovery-challenge.png`
- [x] Register screen is ready — route `/id/register` — `artifacts/journeys/latest/customer-register-success/screenshots/01-register-screen-is-ready.png`
- [x] Customer registers successfully — route `/id/home` — `artifacts/journeys/latest/customer-register-success/screenshots/02-customer-registers-successfully.png`
- [x] Login screen is ready for guard validation — route `/id/login` — `artifacts/journeys/latest/customer-invalid-login/screenshots/01-login-screen-is-ready-for-guard-validation.png`
- [x] Friendly error appears for invalid credentials — route `/id/login` — `artifacts/journeys/latest/customer-invalid-login/screenshots/02-friendly-error-appears-for-invalid-credentials.png`
- [x] Localhost is redirected into the shared dev domain — route `http://localhost:3002/id/login` — `artifacts/journeys/latest/localhost-lvh-redirect/screenshots/01-localhost-is-redirected-into-the-shared-dev-domain.png`

### Customer

- [x] Authenticated customer home is visible — route `/id/home` — `artifacts/journeys/latest/customer-home-profile-notifications/screenshots/01-authenticated-customer-home-is-visible.png`
- [x] Customer profile page is ready — route `/id/profile` — `artifacts/journeys/latest/customer-home-profile-notifications/screenshots/02-customer-profile-page-is-ready.png`
- [x] Customer notifications feed is visible — route `/id/notifications` — `artifacts/journeys/latest/customer-home-profile-notifications/screenshots/03-customer-notifications-feed-is-visible.png`

### Payments

- [x] Refund desk is ready — route `/refunds` — `artifacts/journeys/latest/admin-refund-payout/screenshots/01-refund-desk-is-ready.png`
- [x] Admin creates a new refund record — route `/refunds` — `artifacts/journeys/latest/admin-refund-payout/screenshots/02-admin-creates-a-new-refund-record.png`
- [x] Payout desk is ready — route `/payouts` — `artifacts/journeys/latest/admin-refund-payout/screenshots/03-payout-desk-is-ready.png`
- [x] Admin advances a seeded payout record — route `/payouts` — `artifacts/journeys/latest/admin-refund-payout/screenshots/04-admin-advances-a-seeded-payout-record.png`
- [x] Order activity screen is ready — route `/id/orders` — `artifacts/journeys/latest/customer-order-payment/screenshots/01-order-activity-screen-is-ready.png`
- [x] Customer creates a new quick order — route `/id/orders` — `artifacts/journeys/latest/customer-order-payment/screenshots/02-customer-creates-a-new-quick-order.png`
- [x] Local payment settles the latest order — route `/id/orders` — `artifacts/journeys/latest/customer-order-payment/screenshots/03-local-payment-settles-the-latest-order.png`
- [x] Customer opens the order detail screen — route `/id/orders/[orderId]` — `artifacts/journeys/latest/customer-order-payment/screenshots/04-customer-opens-the-order-detail-screen.png`
- [x] Order-linked chat is usable from order detail — route `/id/orders/[orderId]` — `artifacts/journeys/latest/customer-order-payment/screenshots/05-order-linked-chat-is-usable-from-order-detail.png`
- [x] Order detail can create a support ticket — route `/id/orders/[orderId]` — `artifacts/journeys/latest/customer-order-payment/screenshots/06-order-detail-can-create-a-support-ticket.png`

### Support

- [x] Support center is ready — route `/id/support` — `artifacts/journeys/latest/customer-support-ticket/screenshots/01-support-center-is-ready.png`
- [x] Customer creates a new support ticket — route `/id/support` — `artifacts/journeys/latest/customer-support-ticket/screenshots/02-customer-creates-a-new-support-ticket.png`
- [x] Support ticket appears in the customer queue — route `/id/support` — `artifacts/journeys/latest/customer-support-ticket/screenshots/03-support-ticket-appears-in-the-customer-queue.png`
- [x] Admin triage updates the support ticket state — route `/id/support` — `artifacts/journeys/latest/customer-support-ticket/screenshots/04-admin-triage-updates-the-support-ticket-state.png`
- [x] Admin sees the new customer ticket — route `/support` — `artifacts/journeys/latest/admin-support-triage/screenshots/01-admin-sees-the-new-customer-ticket.png`
- [x] Admin triages the support ticket — route `/support` — `artifacts/journeys/latest/admin-support-triage/screenshots/02-admin-triages-the-support-ticket.png`

### Professional

- [x] Draft professional sees the editable application flow — route `/id/professionals/apply` — `artifacts/journeys/latest/professional-draft-apply-state/screenshots/01-draft-professional-sees-the-editable-application-flow.png`
- [x] Professional apply screen is ready — route `/id/professionals/apply` — `artifacts/journeys/latest/professional-apply-review-state/screenshots/01-professional-apply-screen-is-ready.png`
- [x] Submitted review state is visible — route `/id/professionals/apply` — `artifacts/journeys/latest/professional-apply-review-state/screenshots/02-submitted-review-state-is-visible.png`
- [x] Submitted professional sees the publish gate — route `/id/professionals/dashboard/offerings` — `artifacts/journeys/latest/professional-submitted-offerings-gated/screenshots/01-submitted-professional-sees-the-publish-gate.png`
- [x] Professional workspace overview is ready — route `/id/professionals/dashboard` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/01-professional-workspace-overview-is-ready.png`
- [x] Offering management section opens — route `/id/professionals/dashboard/offerings` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/02-offering-management-section-opens.png`
- [x] Approved professional publishes an offering — route `/id/professionals/dashboard/offerings` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/03-approved-professional-publishes-an-offering.png`
- [x] Professional workspace orders section is reachable — route `/id/professionals/dashboard/orders` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/04-professional-workspace-orders-section-is-reachable.png`
- [x] Professional workspace portfolio section is reachable — route `/id/professionals/dashboard/portfolio` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/05-professional-workspace-portfolio-section-is-reachable.png`
- [x] Professional workspace trust section is reachable — route `/id/professionals/dashboard/trust` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/06-professional-workspace-trust-section-is-reachable.png`
- [x] Professional workspace coverage section is reachable — route `/id/professionals/dashboard/coverage` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/07-professional-workspace-coverage-section-is-reachable.png`
- [x] Professional workspace availability section is reachable — route `/id/professionals/dashboard/availability` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/08-professional-workspace-availability-section-is-reachable.png`
- [x] Professional workspace notifications section is reachable — route `/id/professionals/dashboard/notifications` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/09-professional-workspace-notifications-section-is-reachable.png`
- [x] Professional workspace profile section is reachable — route `/id/professionals/dashboard/profile` — `artifacts/journeys/latest/professional-workspace-approved/screenshots/10-professional-workspace-profile-section-is-reachable.png`

### Admin

- [x] Admin login screen is ready — route `/login` — `artifacts/journeys/latest/admin-login-overview/screenshots/01-admin-login-screen-is-ready.png`
- [x] Admin reaches the overview dashboard — route `/overview` — `artifacts/journeys/latest/admin-login-overview/screenshots/02-admin-reaches-the-overview-dashboard.png`
- [x] Professional review queue is visible — route `/professionals` — `artifacts/journeys/latest/admin-review-queue/screenshots/01-professional-review-queue-is-visible.png`
- [x] Customers desk is visible — route `/customers` — `artifacts/journeys/latest/admin-console-route-map/screenshots/01-customers-desk-is-visible.png`
- [x] Orders desk is visible — route `/orders` — `artifacts/journeys/latest/admin-console-route-map/screenshots/02-orders-desk-is-visible.png`
- [x] Studio snapshot is visible — route `/studio` — `artifacts/journeys/latest/admin-console-route-map/screenshots/03-studio-snapshot-is-visible.png`

## UI Findings

- `P1` Customer home, order flow, dan workspace professional sekarang sudah jauh lebih koheren secara warna dan hierarchy. Problem utama yang tersisa bukan lagi bentrok brand, tetapi density layar panjang yang masih melelahkan untuk discan cepat.
- `P1` Notifications feed masih terlalu repetitif. Card hampir identik dari atas ke bawah, jadi prioritas order, support, dan reminder akun belum langsung terbaca meskipun copy-nya sudah lebih rapi.
- `P1` Support center sudah lebih baik karena tiket aktif muncul lebih dulu, tetapi vertical rhythm-nya masih terlalu tinggi di mobile portrait. Hero, summary tiles, dan list card pertama masih menyisakan banyak ruang kosong sebelum user melihat detail tiket secara utuh.
- `P1` Professional apply flow sudah lebih bersih dan realistis, tetapi masih sangat vertikal. Section identitas, dokumen, dan readiness bercampur dalam satu arus panjang sehingga proses review belum terasa seperti milestone yang jelas.
- `P2` Customer profile modal sudah lebih tenang dan tombol logout tidak lagi terlalu agresif, tetapi hierarchy action di area bawah masih bisa dipadatkan agar kartu profesional dan utility action tidak terasa seperti stack terpisah yang sangat panjang.
- `P2` Public home visitor lebih rapi dari sebelumnya, namun state non-login masih terasa datar dibanding authenticated customer home. Area atas belum cukup membangun trust melalui proof, urgency, atau social reassurance.
- `P2` Long-data handling sudah membaik signifikan. Nama panjang, coverage area, subject support, dan offering title sudah wrap dengan aman, tetapi daftar yang sangat panjang masih butuh grouping dan sticky anchors.

## Recommendations

- Pertahankan arah visual `teal + slate + soft cyan` sebagai fondasi tetap untuk `bidan`; jangan kembali ke aksen magenta besar di CTA utama atau card umum.
- Ubah notifications menjadi grouped timeline dengan heading seperti `Hari ini`, `Perlu aksi`, dan `Sudah selesai` agar user bisa scanning berdasarkan urgency, bukan membaca satu per satu.
- Pertahankan pola support yang kini queue-first, lalu lanjutkan dengan kompresi tinggi section atas: kecilkan hero copy, rapatkan summary tiles, dan pertimbangkan form tiket baru sebagai sheet terpisah agar viewport pertama lebih informatif.
- Pecah professional apply menjadi milestone yang eksplisit: `Identitas`, `Dokumen`, `Kesiapan layanan`, `Review notes`. Tambahkan progress rail atau sticky mini-summary agar form panjang terasa lebih terarah.
- Terus jaga action sekunder seperti logout dan utility links tetap low-emphasis. Langkah berikutnya adalah memadatkan stack action di profile agar jalur `edit profile`, `support`, dan `professional path` terasa satu sistem, bukan tiga blok terpisah.
- Tambahkan audit khusus tablet dan desktop untuk surface `bidan`, terutama workspace professional dan support queue, supaya density layout tidak hanya aman di mobile portrait.

## Coverage Gaps

- Belum ada screenshot khusus untuk empty state tanpa data pada customer baru, professional baru, dan admin tanpa queue.
- Belum ada audit visual khusus tablet dan desktop untuk `bidan`; artefak saat ini dominan mobile portrait, sementara admin dominan desktop.
- Belum ada journey untuk error state jaringan, upload gagal, atau validasi form field yang sangat panjang di professional workspace.
- Services listing root belum dipisah menjadi screenshot tersendiri; saat ini coverage berhenti di service detail setelah navigasi dari katalog.
