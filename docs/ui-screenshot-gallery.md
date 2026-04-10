# UI Screenshot Gallery

Satu tempat untuk review visual semua screenshot journey terbaru.

## Run Meta

- Run id: `2026-04-10T10-34-53-387Z`
- Command: `npm run e2e:journey`
- Base URL: `http://bidan.lvh.me:3002`
- Hasil: `22/22 use case passed`
- Screenshot: `61`
- Index: `artifacts/journeys/latest/index.json`
- Report: `artifacts/playwright-report/latest/index.html`

## Cara Pakai

- Baca dari gambar dulu, bukan matrix teks.
- Gunakan `Persona`, `Route`, dan `State` untuk tahu posisi user dan konteks layar.
- Gunakan `Path` untuk membuka file screenshot langsung bila perlu zoom detail.

## Public

### Visitor public browsing flow

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/public-visitor-browse/screenshots/01-public-home-root-is-ready.png"><img src="../artifacts/journeys/latest/public-visitor-browse/screenshots/01-public-home-root-is-ready.png" alt="public-visitor-browse - Public home root is ready" width="100%" /></a>
<br><strong>Public home root is ready</strong>
<br><code>public-visitor-browse</code>
<br><strong>Route:</strong> <code>/id</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id</code>
<br><strong>Persona:</strong> Visitor without login
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>public-home-root</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/public-visitor-browse/screenshots/01-public-home-root-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Visitor masuk langsung ke home publik canonical.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/public-visitor-browse/screenshots/02-explore-professionals-is-visible.png"><img src="../artifacts/journeys/latest/public-visitor-browse/screenshots/02-explore-professionals-is-visible.png" alt="public-visitor-browse - Explore professionals is visible" width="100%" /></a>
<br><strong>Explore professionals is visible</strong>
<br><code>public-visitor-browse</code>
<br><strong>Route:</strong> <code>/id/explore</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/explore</code>
<br><strong>Persona:</strong> Visitor without login
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>public-explore</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/public-visitor-browse/screenshots/02-explore-professionals-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Visitor bisa menjelajahi profesional yang sudah approved di halaman explore.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/public-visitor-browse/screenshots/03-professional-detail-page-opens.png"><img src="../artifacts/journeys/latest/public-visitor-browse/screenshots/03-professional-detail-page-opens.png" alt="public-visitor-browse - Professional detail page opens" width="100%" /></a>
<br><strong>Professional detail page opens</strong>
<br><code>public-visitor-browse</code>
<br><strong>Route:</strong> <code>/id/p/[slug]</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/p/bidan-nabila-lestari</code>
<br><strong>Persona:</strong> Visitor without login
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>public-professional-detail</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/public-visitor-browse/screenshots/03-professional-detail-page-opens.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Visitor dapat membuka detail profesional publik dan melihat service list terkait.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/public-visitor-browse/screenshots/04-service-catalog-and-detail-page-are-reachable.png"><img src="../artifacts/journeys/latest/public-visitor-browse/screenshots/04-service-catalog-and-detail-page-are-reachable.png" alt="public-visitor-browse - Service catalog and detail page are reachable" width="100%" /></a>
<br><strong>Service catalog and detail page are reachable</strong>
<br><code>public-visitor-browse</code>
<br><strong>Route:</strong> <code>/id/s/[slug]</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/s/paket-nifas-sore-80005</code>
<br><strong>Persona:</strong> Visitor without login
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>public-service-detail</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/public-visitor-browse/screenshots/04-service-catalog-and-detail-page-are-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Visitor bisa berpindah dari katalog layanan ke halaman detail layanan publik.
</td>
</tr>
</table>

## Auth

### Customer invalid login guard

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-invalid-login/screenshots/01-login-screen-is-ready-for-guard-validation.png"><img src="../artifacts/journeys/latest/customer-invalid-login/screenshots/01-login-screen-is-ready-for-guard-validation.png" alt="customer-invalid-login - Login screen is ready for guard validation" width="100%" /></a>
<br><strong>Login screen is ready for guard validation</strong>
<br><code>customer-invalid-login</code>
<br><strong>Route:</strong> <code>/id/login</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/login</code>
<br><strong>Persona:</strong> +628111111001 / wrong-password
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-login-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-invalid-login/screenshots/01-login-screen-is-ready-for-guard-validation.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Form login siap dipakai untuk pengujian kredensial salah.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-invalid-login/screenshots/02-friendly-error-appears-for-invalid-credentials.png"><img src="../artifacts/journeys/latest/customer-invalid-login/screenshots/02-friendly-error-appears-for-invalid-credentials.png" alt="customer-invalid-login - Friendly error appears for invalid credentials" width="100%" /></a>
<br><strong>Friendly error appears for invalid credentials</strong>
<br><code>customer-invalid-login</code>
<br><strong>Route:</strong> <code>/id/login</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/login</code>
<br><strong>Persona:</strong> +628111111001 / wrong-password
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-login-error</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-invalid-login/screenshots/02-friendly-error-appears-for-invalid-credentials.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> UI menolak login, tetap berada di layar login, dan menjelaskan bahwa nomor ponsel atau kata sandi tidak cocok.
</td>
</tr>
</table>

### Customer login and native account security

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-auth-sso/screenshots/01-login-screen-is-ready.png"><img src="../artifacts/journeys/latest/customer-auth-sso/screenshots/01-login-screen-is-ready.png" alt="customer-auth-sso - Login screen is ready" width="100%" /></a>
<br><strong>Login screen is ready</strong>
<br><code>customer-auth-sso</code>
<br><strong>Route:</strong> <code>/id/login</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/login</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>login-screen-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-auth-sso/screenshots/01-login-screen-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Form login customer tampil di Bidan dengan CTA yang siap dipakai.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-auth-sso/screenshots/02-customer-signs-in-from-bidan.png"><img src="../artifacts/journeys/latest/customer-auth-sso/screenshots/02-customer-signs-in-from-bidan.png" alt="customer-auth-sso - Customer signs in from Bidan" width="100%" /></a>
<br><strong>Customer signs in from Bidan</strong>
<br><code>customer-auth-sso</code>
<br><strong>Route:</strong> <code>/id</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-signs-in-from-bidan</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-auth-sso/screenshots/02-customer-signs-in-from-bidan.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer berhasil masuk dan diarahkan ke halaman utama Bidan.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-auth-sso/screenshots/03-native-security-screen-resolves-the-signed-in-account.png"><img src="../artifacts/journeys/latest/customer-auth-sso/screenshots/03-native-security-screen-resolves-the-signed-in-account.png" alt="customer-auth-sso - Native security screen resolves the signed-in account" width="100%" /></a>
<br><strong>Native security screen resolves the signed-in account</strong>
<br><code>customer-auth-sso</code>
<br><strong>Route:</strong> <code>/id/security</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/security</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-security-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-auth-sso/screenshots/03-native-security-screen-resolves-the-signed-in-account.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Pengaturan keamanan akun tampil langsung di Bidan tanpa pindah ke app lain.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-auth-sso/screenshots/04-device-sessions-show-multiple-entries.png"><img src="../artifacts/journeys/latest/customer-auth-sso/screenshots/04-device-sessions-show-multiple-entries.png" alt="customer-auth-sso - Device sessions show multiple entries" width="100%" /></a>
<br><strong>Device sessions show multiple entries</strong>
<br><code>customer-auth-sso</code>
<br><strong>Route:</strong> <code>/id/sessions</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/sessions</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-device-sessions-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-auth-sso/screenshots/04-device-sessions-show-multiple-entries.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Bidan menampilkan daftar device aktif dan CTA untuk logout device lain.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-auth-sso/screenshots/05-customer-logs-out-other-devices.png"><img src="../artifacts/journeys/latest/customer-auth-sso/screenshots/05-customer-logs-out-other-devices.png" alt="customer-auth-sso - Customer logs out other devices" width="100%" /></a>
<br><strong>Customer logs out other devices</strong>
<br><code>customer-auth-sso</code>
<br><strong>Route:</strong> <code>/id/sessions</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/sessions</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-device-sessions-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-auth-sso/screenshots/05-customer-logs-out-other-devices.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Semua device lain diputus dan session saat ini tetap aktif.
</td>
<td width="50%"></td>
</tr>
</table>

### Customer native register flow

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-register-success/screenshots/01-register-screen-is-ready.png"><img src="../artifacts/journeys/latest/customer-register-success/screenshots/01-register-screen-is-ready.png" alt="customer-register-success - Register screen is ready" width="100%" /></a>
<br><strong>Register screen is ready</strong>
<br><code>customer-register-success</code>
<br><strong>Route:</strong> <code>/id/register</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/register</code>
<br><strong>Persona:</strong> +6281299336187 / JourneyReg#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-register-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-register-success/screenshots/01-register-screen-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Form register native Bidan tampil dan siap dipakai tanpa redirect ke surface lain.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-register-success/screenshots/02-customer-registers-successfully.png"><img src="../artifacts/journeys/latest/customer-register-success/screenshots/02-customer-registers-successfully.png" alt="customer-register-success - Customer registers successfully" width="100%" /></a>
<br><strong>Customer registers successfully</strong>
<br><code>customer-register-success</code>
<br><strong>Route:</strong> <code>/id</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id</code>
<br><strong>Persona:</strong> +6281299336187 / JourneyReg#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-home-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-register-success/screenshots/02-customer-registers-successfully.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer berhasil membuat akun baru dan masuk ke halaman utama Bidan.
</td>
</tr>
</table>

### Customer password recovery request

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-password-recovery/screenshots/01-recovery-screen-is-ready.png"><img src="../artifacts/journeys/latest/customer-password-recovery/screenshots/01-recovery-screen-is-ready.png" alt="customer-password-recovery - Recovery screen is ready" width="100%" /></a>
<br><strong>Recovery screen is ready</strong>
<br><code>customer-password-recovery</code>
<br><strong>Route:</strong> <code>/id/forgot-password</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/forgot-password</code>
<br><strong>Persona:</strong> +628111111001
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>recovery-screen-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-password-recovery/screenshots/01-recovery-screen-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Form reset password tampil dengan input nomor ponsel dan CTA kirim OTP.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-password-recovery/screenshots/02-otp-request-starts-the-recovery-challenge.png"><img src="../artifacts/journeys/latest/customer-password-recovery/screenshots/02-otp-request-starts-the-recovery-challenge.png" alt="customer-password-recovery - OTP request starts the recovery challenge" width="100%" /></a>
<br><strong>OTP request starts the recovery challenge</strong>
<br><code>customer-password-recovery</code>
<br><strong>Route:</strong> <code>/id/forgot-password</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/forgot-password</code>
<br><strong>Persona:</strong> +628111111001
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>otp-request-starts-the-recovery-challenge</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-password-recovery/screenshots/02-otp-request-starts-the-recovery-challenge.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> UI berpindah ke state OTP dengan challenge id dan destinasi masked.
</td>
</tr>
</table>

### Localhost redirect guard

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/localhost-lvh-redirect/screenshots/01-localhost-is-redirected-into-the-shared-dev-domain.png"><img src="../artifacts/journeys/latest/localhost-lvh-redirect/screenshots/01-localhost-is-redirected-into-the-shared-dev-domain.png" alt="localhost-lvh-redirect - Localhost is redirected into the shared dev domain" width="100%" /></a>
<br><strong>Localhost is redirected into the shared dev domain</strong>
<br><code>localhost-lvh-redirect</code>
<br><strong>Route:</strong> <code>http://localhost:3002/id/login</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/login</code>
<br><strong>Persona:</strong> Local browser on localhost
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>localhost-redirect-guard</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/localhost-lvh-redirect/screenshots/01-localhost-is-redirected-into-the-shared-dev-domain.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Halaman login lokal tidak tinggal di localhost dan otomatis berpindah ke domain .lvh.me yang benar.
</td>
<td width="50%"></td>
</tr>
</table>

## Customer

### Customer home, profile, and notifications

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-home-profile-notifications/screenshots/01-authenticated-customer-home-is-visible.png"><img src="../artifacts/journeys/latest/customer-home-profile-notifications/screenshots/01-authenticated-customer-home-is-visible.png" alt="customer-home-profile-notifications - Authenticated customer home is visible" width="100%" /></a>
<br><strong>Authenticated customer home is visible</strong>
<br><code>customer-home-profile-notifications</code>
<br><strong>Route:</strong> <code>/id</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-home</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-home-profile-notifications/screenshots/01-authenticated-customer-home-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer tiba di home feed yang memuat aktivitas, layanan populer, dan profesional tepercaya.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-home-profile-notifications/screenshots/02-customer-profile-page-is-ready.png"><img src="../artifacts/journeys/latest/customer-home-profile-notifications/screenshots/02-customer-profile-page-is-ready.png" alt="customer-home-profile-notifications - Customer profile page is ready" width="100%" /></a>
<br><strong>Customer profile page is ready</strong>
<br><code>customer-home-profile-notifications</code>
<br><strong>Route:</strong> <code>/id/profile</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/profile</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-profile</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-home-profile-notifications/screenshots/02-customer-profile-page-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer bisa membuka profil, melihat quick actions, lalu memunculkan sheet edit profil dari action card utama.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-home-profile-notifications/screenshots/03-customer-notifications-feed-is-visible.png"><img src="../artifacts/journeys/latest/customer-home-profile-notifications/screenshots/03-customer-notifications-feed-is-visible.png" alt="customer-home-profile-notifications - Customer notifications feed is visible" width="100%" /></a>
<br><strong>Customer notifications feed is visible</strong>
<br><code>customer-home-profile-notifications</code>
<br><strong>Route:</strong> <code>/id/notifications</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/notifications</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-notifications</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-home-profile-notifications/screenshots/03-customer-notifications-feed-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer bisa melihat feed notifikasi yang relevan dengan order, support, atau review.
</td>
<td width="50%"></td>
</tr>
</table>

### Empty customer surface audit

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-empty-state-surfaces/screenshots/01-empty-customer-support-queue-is-controlled.png"><img src="../artifacts/journeys/latest/customer-empty-state-surfaces/screenshots/01-empty-customer-support-queue-is-controlled.png" alt="customer-empty-state-surfaces - Empty customer support queue is controlled" width="100%" /></a>
<br><strong>Empty customer support queue is controlled</strong>
<br><code>customer-empty-state-surfaces</code>
<br><strong>Route:</strong> <code>/id/support</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/support</code>
<br><strong>Persona:</strong> +628111111005 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-empty-support</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-empty-state-surfaces/screenshots/01-empty-customer-support-queue-is-controlled.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer baru tidak melihat layar support yang kacau meski belum punya tiket sama sekali.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-empty-state-surfaces/screenshots/02-empty-customer-notifications-stay-elegant.png"><img src="../artifacts/journeys/latest/customer-empty-state-surfaces/screenshots/02-empty-customer-notifications-stay-elegant.png" alt="customer-empty-state-surfaces - Empty customer notifications stay elegant" width="100%" /></a>
<br><strong>Empty customer notifications stay elegant</strong>
<br><code>customer-empty-state-surfaces</code>
<br><strong>Route:</strong> <code>/id/notifications</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/notifications</code>
<br><strong>Persona:</strong> +628111111005 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-empty-notifications</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-empty-state-surfaces/screenshots/02-empty-customer-notifications-stay-elegant.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Feed notifikasi tetap elegan dan jelas saat customer belum punya aktivitas tersimpan.
</td>
</tr>
</table>

## Payments

### Admin refund and payout flow

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-refund-payout/screenshots/01-refund-desk-is-ready.png"><img src="../artifacts/journeys/latest/admin-refund-payout/screenshots/01-refund-desk-is-ready.png" alt="admin-refund-payout - Refund desk is ready" width="100%" /></a>
<br><strong>Refund desk is ready</strong>
<br><code>admin-refund-payout</code>
<br><strong>Route:</strong> <code>/refunds</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/refunds</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>refund-desk-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-refund-payout/screenshots/01-refund-desk-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin melihat quick pick seeded orders dan antrean refund yang aktif.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-refund-payout/screenshots/02-admin-creates-a-new-refund-record.png"><img src="../artifacts/journeys/latest/admin-refund-payout/screenshots/02-admin-creates-a-new-refund-record.png" alt="admin-refund-payout - Admin creates a new refund record" width="100%" /></a>
<br><strong>Admin creates a new refund record</strong>
<br><code>admin-refund-payout</code>
<br><strong>Route:</strong> <code>/refunds</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/refunds</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-creates-a-new-refund-record</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-refund-payout/screenshots/02-admin-creates-a-new-refund-record.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Record refund baru muncul di antrean refund dengan alasan yang diisikan admin.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-refund-payout/screenshots/03-payout-desk-is-ready.png"><img src="../artifacts/journeys/latest/admin-refund-payout/screenshots/03-payout-desk-is-ready.png" alt="admin-refund-payout - Payout desk is ready" width="100%" /></a>
<br><strong>Payout desk is ready</strong>
<br><code>admin-refund-payout</code>
<br><strong>Route:</strong> <code>/payouts</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/payouts</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>payout-desk-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-refund-payout/screenshots/03-payout-desk-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin melihat quick pick professional profile dan antrean payout.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-refund-payout/screenshots/04-admin-advances-a-seeded-payout-record.png"><img src="../artifacts/journeys/latest/admin-refund-payout/screenshots/04-admin-advances-a-seeded-payout-record.png" alt="admin-refund-payout - Admin advances a seeded payout record" width="100%" /></a>
<br><strong>Admin advances a seeded payout record</strong>
<br><code>admin-refund-payout</code>
<br><strong>Route:</strong> <code>/payouts</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/payouts</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-advances-a-seeded-payout-record</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-refund-payout/screenshots/04-admin-advances-a-seeded-payout-record.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin bisa memajukan payout pending ke status processing dari desk payout.
</td>
</tr>
</table>

### Customer order and payment simulation

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-order-payment/screenshots/01-order-activity-screen-is-ready.png"><img src="../artifacts/journeys/latest/customer-order-payment/screenshots/01-order-activity-screen-is-ready.png" alt="customer-order-payment - Order activity screen is ready" width="100%" /></a>
<br><strong>Order activity screen is ready</strong>
<br><code>customer-order-payment</code>
<br><strong>Route:</strong> <code>/id/orders</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/orders</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>order-activity-screen-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-order-payment/screenshots/01-order-activity-screen-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Daftar order dan quick order composer tampil dengan seeded offerings.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-order-payment/screenshots/02-customer-creates-a-new-quick-order.png"><img src="../artifacts/journeys/latest/customer-order-payment/screenshots/02-customer-creates-a-new-quick-order.png" alt="customer-order-payment - Customer creates a new quick order" width="100%" /></a>
<br><strong>Customer creates a new quick order</strong>
<br><code>customer-order-payment</code>
<br><strong>Route:</strong> <code>/id/orders</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/orders</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-creates-a-new-quick-order</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-order-payment/screenshots/02-customer-creates-a-new-quick-order.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Order berhasil dibuat dan langkah pembayaran lokal langsung tersedia.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-order-payment/screenshots/03-local-payment-settles-the-latest-order.png"><img src="../artifacts/journeys/latest/customer-order-payment/screenshots/03-local-payment-settles-the-latest-order.png" alt="customer-order-payment - Local payment settles the latest order" width="100%" /></a>
<br><strong>Local payment settles the latest order</strong>
<br><code>customer-order-payment</code>
<br><strong>Route:</strong> <code>/id/orders</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/orders</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>local-payment-settles-the-latest-order</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-order-payment/screenshots/03-local-payment-settles-the-latest-order.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Pembayaran berpindah ke status paid dan feedback sukses tampil di layar.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-order-payment/screenshots/04-customer-opens-the-order-detail-screen.png"><img src="../artifacts/journeys/latest/customer-order-payment/screenshots/04-customer-opens-the-order-detail-screen.png" alt="customer-order-payment - Customer opens the order detail screen" width="100%" /></a>
<br><strong>Customer opens the order detail screen</strong>
<br><code>customer-order-payment</code>
<br><strong>Route:</strong> <code>/id/orders/ord_4bb7e7e31d304969</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/orders/ord_4bb7e7e31d304969</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-opens-the-order-detail-screen</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-order-payment/screenshots/04-customer-opens-the-order-detail-screen.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer dapat masuk ke detail order untuk melihat payment state dan tindakan lanjutan.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-order-payment/screenshots/05-order-linked-chat-is-usable-from-order-detail.png"><img src="../artifacts/journeys/latest/customer-order-payment/screenshots/05-order-linked-chat-is-usable-from-order-detail.png" alt="customer-order-payment - Order-linked chat is usable from order detail" width="100%" /></a>
<br><strong>Order-linked chat is usable from order detail</strong>
<br><code>customer-order-payment</code>
<br><strong>Route:</strong> <code>/id/orders/[orderId]</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/orders/ord_4bb7e7e31d304969</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-order-chat</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-order-payment/screenshots/05-order-linked-chat-is-usable-from-order-detail.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer dapat membuka thread chat order dan mengirim pesan follow-up dari halaman detail.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-order-payment/screenshots/06-order-detail-can-create-a-support-ticket.png"><img src="../artifacts/journeys/latest/customer-order-payment/screenshots/06-order-detail-can-create-a-support-ticket.png" alt="customer-order-payment - Order detail can create a support ticket" width="100%" /></a>
<br><strong>Order detail can create a support ticket</strong>
<br><code>customer-order-payment</code>
<br><strong>Route:</strong> <code>/id/orders/[orderId]</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/orders/ord_4bb7e7e31d304969</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-order-support</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-order-payment/screenshots/06-order-detail-can-create-a-support-ticket.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Customer dapat membuat tiket support langsung dari halaman detail order ketika membutuhkan bantuan lanjutan.
</td>
</tr>
</table>

## Support

### Admin support triage flow

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-support-triage/screenshots/01-admin-sees-the-new-customer-ticket.png"><img src="../artifacts/journeys/latest/admin-support-triage/screenshots/01-admin-sees-the-new-customer-ticket.png" alt="admin-support-triage - Admin sees the new customer ticket" width="100%" /></a>
<br><strong>Admin sees the new customer ticket</strong>
<br><code>admin-support-triage</code>
<br><strong>Route:</strong> <code>/support</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/support</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-sees-the-new-customer-ticket</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-support-triage/screenshots/01-admin-sees-the-new-customer-ticket.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Ticket customer yang baru dibuat terlihat di support desk admin.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-support-triage/screenshots/02-admin-triages-the-support-ticket.png"><img src="../artifacts/journeys/latest/admin-support-triage/screenshots/02-admin-triages-the-support-ticket.png" alt="admin-support-triage - Admin triages the support ticket" width="100%" /></a>
<br><strong>Admin triages the support ticket</strong>
<br><code>admin-support-triage</code>
<br><strong>Route:</strong> <code>/support</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/support</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-triages-the-support-ticket</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-support-triage/screenshots/02-admin-triages-the-support-ticket.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Ticket masuk ke state triaged/reviewing dan catatan penanganan tersimpan.
</td>
</tr>
</table>

### Customer support ticket flow

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-support-ticket/screenshots/01-support-center-is-ready.png"><img src="../artifacts/journeys/latest/customer-support-ticket/screenshots/01-support-center-is-ready.png" alt="customer-support-ticket - Support center is ready" width="100%" /></a>
<br><strong>Support center is ready</strong>
<br><code>customer-support-ticket</code>
<br><strong>Route:</strong> <code>/id/support</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/support</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>support-center-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-support-ticket/screenshots/01-support-center-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Form tiket baru dan daftar tiket existing tampil di satu layar.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-support-ticket/screenshots/02-customer-creates-a-new-support-ticket.png"><img src="../artifacts/journeys/latest/customer-support-ticket/screenshots/02-customer-creates-a-new-support-ticket.png" alt="customer-support-ticket - Customer creates a new support ticket" width="100%" /></a>
<br><strong>Customer creates a new support ticket</strong>
<br><code>customer-support-ticket</code>
<br><strong>Route:</strong> <code>/id/support</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/support</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-creates-a-new-support-ticket</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-support-ticket/screenshots/02-customer-creates-a-new-support-ticket.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Tiket baru berhasil dibuat dan konfirmasi sukses muncul di layar.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-support-ticket/screenshots/03-support-ticket-appears-in-the-customer-queue.png"><img src="../artifacts/journeys/latest/customer-support-ticket/screenshots/03-support-ticket-appears-in-the-customer-queue.png" alt="customer-support-ticket - Support ticket appears in the customer queue" width="100%" /></a>
<br><strong>Support ticket appears in the customer queue</strong>
<br><code>customer-support-ticket</code>
<br><strong>Route:</strong> <code>/id/support</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/support</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>support-ticket-appears-in-the-customer-queue</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-support-ticket/screenshots/03-support-ticket-appears-in-the-customer-queue.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Tiket yang baru dibuat langsung muncul di bagian tiket saya.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/customer-support-ticket/screenshots/04-admin-triage-updates-the-support-ticket-state.png"><img src="../artifacts/journeys/latest/customer-support-ticket/screenshots/04-admin-triage-updates-the-support-ticket-state.png" alt="customer-support-ticket - Admin triage updates the support ticket state" width="100%" /></a>
<br><strong>Admin triage updates the support ticket state</strong>
<br><code>customer-support-ticket</code>
<br><strong>Route:</strong> <code>/id/support</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/support</code>
<br><strong>Persona:</strong> +628111111001 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>customer-support-after-admin-triage</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/customer-support-ticket/screenshots/04-admin-triage-updates-the-support-ticket-state.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Ticket yang baru dibuat customer diproses oleh admin dan berpindah ke state triaged.
</td>
</tr>
</table>

## Professional

### Approved professional workspace flow

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/01-professional-workspace-overview-is-ready.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/01-professional-workspace-overview-is-ready.png" alt="professional-workspace-approved - Professional workspace overview is ready" width="100%" /></a>
<br><strong>Professional workspace overview is ready</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-overview-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/01-professional-workspace-overview-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Workspace profesional memuat ringkasan seeded dan section console aktif.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/02-offering-management-section-opens.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/02-offering-management-section-opens.png" alt="professional-workspace-approved - Offering management section opens" width="100%" /></a>
<br><strong>Offering management section opens</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/offerings</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/offerings</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>offering-management-section-opens</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/02-offering-management-section-opens.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section offerings menampilkan form publish dan daftar layanan aktif.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/03-approved-professional-publishes-an-offering.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/03-approved-professional-publishes-an-offering.png" alt="professional-workspace-approved - Approved professional publishes an offering" width="100%" /></a>
<br><strong>Approved professional publishes an offering</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/offerings</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/offerings</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>approved-professional-publishes-an-offering</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/03-approved-professional-publishes-an-offering.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Offering baru berhasil dipublish dan langsung muncul di daftar layanan aktif.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/04-professional-workspace-orders-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/04-professional-workspace-orders-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace orders section is reachable" width="100%" /></a>
<br><strong>Professional workspace orders section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/orders</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/orders</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-orders</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/04-professional-workspace-orders-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section orders menampilkan antrean permintaan pelanggan untuk profesional approved.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/05-professional-workspace-portfolio-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/05-professional-workspace-portfolio-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace portfolio section is reachable" width="100%" /></a>
<br><strong>Professional workspace portfolio section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/portfolio</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/portfolio</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-portfolio</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/05-professional-workspace-portfolio-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section portfolio memuat showcase seeded dan form pengelolaan aset profesional.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/06-professional-workspace-trust-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/06-professional-workspace-trust-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace trust section is reachable" width="100%" /></a>
<br><strong>Professional workspace trust section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/trust</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/trust</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-trust</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/06-professional-workspace-trust-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section trust memperlihatkan kredensial dan cerita profesional yang harus tetap terbaca.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/07-professional-workspace-coverage-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/07-professional-workspace-coverage-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace coverage section is reachable" width="100%" /></a>
<br><strong>Professional workspace coverage section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/coverage</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/coverage</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-coverage</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/07-professional-workspace-coverage-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section coverage menampilkan area layanan seeded tanpa kehilangan keterbacaan.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/08-professional-workspace-availability-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/08-professional-workspace-availability-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace availability section is reachable" width="100%" /></a>
<br><strong>Professional workspace availability section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/availability</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/availability</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-availability</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/08-professional-workspace-availability-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section availability memuat jadwal praktik dan tetap stabil untuk data jam yang panjang.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/09-professional-workspace-notifications-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/09-professional-workspace-notifications-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace notifications section is reachable" width="100%" /></a>
<br><strong>Professional workspace notifications section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/notifications</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/notifications</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-notifications</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/09-professional-workspace-notifications-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section notifications menampilkan preferensi channel secara jelas dan mudah dipindai.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-workspace-approved/screenshots/10-professional-workspace-profile-section-is-reachable.png"><img src="../artifacts/journeys/latest/professional-workspace-approved/screenshots/10-professional-workspace-profile-section-is-reachable.png" alt="professional-workspace-approved - Professional workspace profile section is reachable" width="100%" /></a>
<br><strong>Professional workspace profile section is reachable</strong>
<br><code>professional-workspace-approved</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/profile</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/profile</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-workspace-profile</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-workspace-approved/screenshots/10-professional-workspace-profile-section-is-reachable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section profile tetap terbaca untuk nama, slug, dan kota dengan panjang data realistis.
</td>
</tr>
</table>

### Draft professional apply state

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-draft-apply-state/screenshots/01-draft-professional-sees-the-editable-application-flow.png"><img src="../artifacts/journeys/latest/professional-draft-apply-state/screenshots/01-draft-professional-sees-the-editable-application-flow.png" alt="professional-draft-apply-state - Draft professional sees the editable application flow" width="100%" /></a>
<br><strong>Draft professional sees the editable application flow</strong>
<br><code>professional-draft-apply-state</code>
<br><strong>Route:</strong> <code>/id/professionals/apply</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/apply</code>
<br><strong>Persona:</strong> +628111111004 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-apply-draft</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-draft-apply-state/screenshots/01-draft-professional-sees-the-editable-application-flow.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Professional draft masuk ke state onboarding yang masih bisa dilengkapi dan dikirim.
</td>
<td width="50%"></td>
</tr>
</table>

### Empty professional state audit

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-empty-state-audit/screenshots/01-empty-professional-apply-state-is-readable.png"><img src="../artifacts/journeys/latest/professional-empty-state-audit/screenshots/01-empty-professional-apply-state-is-readable.png" alt="professional-empty-state-audit - Empty professional apply state is readable" width="100%" /></a>
<br><strong>Empty professional apply state is readable</strong>
<br><code>professional-empty-state-audit</code>
<br><strong>Route:</strong> <code>/id/professionals/apply</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/apply</code>
<br><strong>Persona:</strong> +628111111006 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-empty-apply</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-empty-state-audit/screenshots/01-empty-professional-apply-state-is-readable.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Professional baru bisa membaca progres onboarding dengan jelas sejak state paling kosong.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-empty-state-audit/screenshots/02-empty-professional-workspace-stays-intentional.png"><img src="../artifacts/journeys/latest/professional-empty-state-audit/screenshots/02-empty-professional-workspace-stays-intentional.png" alt="professional-empty-state-audit - Empty professional workspace stays intentional" width="100%" /></a>
<br><strong>Empty professional workspace stays intentional</strong>
<br><code>professional-empty-state-audit</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard</code>
<br><strong>Persona:</strong> +628111111006 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-empty-workspace</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-empty-state-audit/screenshots/02-empty-professional-workspace-stays-intentional.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Workspace profesional baru tetap terasa intentional walau belum punya offering, coverage, atau order.
</td>
</tr>
</table>

### Professional apply validation state

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-apply-validation-state/screenshots/01-incomplete-professional-application-shows-validation-feedback.png"><img src="../artifacts/journeys/latest/professional-apply-validation-state/screenshots/01-incomplete-professional-application-shows-validation-feedback.png" alt="professional-apply-validation-state - Incomplete professional application shows validation feedback" width="100%" /></a>
<br><strong>Incomplete professional application shows validation feedback</strong>
<br><code>professional-apply-validation-state</code>
<br><strong>Route:</strong> <code>/id/professionals/apply</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/apply</code>
<br><strong>Persona:</strong> +628111111006 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-apply-validation</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-apply-validation-state/screenshots/01-incomplete-professional-application-shows-validation-feedback.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Professional baru mendapat error validasi yang jelas ketika field wajib belum dilengkapi.
</td>
<td width="50%"></td>
</tr>
</table>

### Professional desktop shell smoke

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-desktop-shell-smoke/screenshots/01-desktop-mobile-shell-remains-intentional.png"><img src="../artifacts/journeys/latest/professional-desktop-shell-smoke/screenshots/01-desktop-mobile-shell-remains-intentional.png" alt="professional-desktop-shell-smoke - Desktop mobile shell remains intentional" width="100%" /></a>
<br><strong>Desktop mobile shell remains intentional</strong>
<br><code>professional-desktop-shell-smoke</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard</code>
<br><strong>Persona:</strong> +628111111002 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x960</code>
<br><strong>State:</strong> <code>professional-desktop-shell</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-desktop-shell-smoke/screenshots/01-desktop-mobile-shell-remains-intentional.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Shell mobile tetap intentional saat centered di layar desktop lebar.
</td>
<td width="50%"></td>
</tr>
</table>

### Submitted professional application review state

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-apply-review-state/screenshots/01-professional-apply-screen-is-ready.png"><img src="../artifacts/journeys/latest/professional-apply-review-state/screenshots/01-professional-apply-screen-is-ready.png" alt="professional-apply-review-state - Professional apply screen is ready" width="100%" /></a>
<br><strong>Professional apply screen is ready</strong>
<br><code>professional-apply-review-state</code>
<br><strong>Route:</strong> <code>/id/professionals/apply</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/apply</code>
<br><strong>Persona:</strong> +628111111003 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-apply-screen-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-apply-review-state/screenshots/01-professional-apply-screen-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Layar apply memuat status aplikasi dan state review professional yang sudah submit.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-apply-review-state/screenshots/02-submitted-review-state-is-visible.png"><img src="../artifacts/journeys/latest/professional-apply-review-state/screenshots/02-submitted-review-state-is-visible.png" alt="professional-apply-review-state - Submitted review state is visible" width="100%" /></a>
<br><strong>Submitted review state is visible</strong>
<br><code>professional-apply-review-state</code>
<br><strong>Route:</strong> <code>/id/professionals/apply</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/apply</code>
<br><strong>Persona:</strong> +628111111003 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>submitted-review-state-is-visible</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-apply-review-state/screenshots/02-submitted-review-state-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Status submitted atau pending_review tampil jelas tanpa perlu menebak state backend.
</td>
</tr>
</table>

### Submitted professional publish gate

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/professional-submitted-offerings-gated/screenshots/01-submitted-professional-sees-the-publish-gate.png"><img src="../artifacts/journeys/latest/professional-submitted-offerings-gated/screenshots/01-submitted-professional-sees-the-publish-gate.png" alt="professional-submitted-offerings-gated - Submitted professional sees the publish gate" width="100%" /></a>
<br><strong>Submitted professional sees the publish gate</strong>
<br><code>professional-submitted-offerings-gated</code>
<br><strong>Route:</strong> <code>/id/professionals/dashboard/offerings</code>
<br><strong>URL:</strong> <code>http://bidan.lvh.me:3002/id/professionals/dashboard/offerings</code>
<br><strong>Persona:</strong> +628111111003 / BidanDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-offerings-gated</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/professional-submitted-offerings-gated/screenshots/01-submitted-professional-sees-the-publish-gate.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Section layanan menjelaskan bahwa publish offering masih terkunci sampai profil disetujui.
</td>
<td width="50%"></td>
</tr>
</table>

## Admin

### Admin console route coverage

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-console-route-map/screenshots/01-customers-desk-is-visible.png"><img src="../artifacts/journeys/latest/admin-console-route-map/screenshots/01-customers-desk-is-visible.png" alt="admin-console-route-map - Customers desk is visible" width="100%" /></a>
<br><strong>Customers desk is visible</strong>
<br><code>admin-console-route-map</code>
<br><strong>Route:</strong> <code>/customers</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/customers</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-customers</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-console-route-map/screenshots/01-customers-desk-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin dapat membuka daftar customer aktif di desk customers.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-console-route-map/screenshots/02-orders-desk-is-visible.png"><img src="../artifacts/journeys/latest/admin-console-route-map/screenshots/02-orders-desk-is-visible.png" alt="admin-console-route-map - Orders desk is visible" width="100%" /></a>
<br><strong>Orders desk is visible</strong>
<br><code>admin-console-route-map</code>
<br><strong>Route:</strong> <code>/orders</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/orders</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-orders</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-console-route-map/screenshots/02-orders-desk-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin dapat membuka order desk dan melihat action untuk mark paid atau complete.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-console-route-map/screenshots/03-studio-snapshot-is-visible.png"><img src="../artifacts/journeys/latest/admin-console-route-map/screenshots/03-studio-snapshot-is-visible.png" alt="admin-console-route-map - Studio snapshot is visible" width="100%" /></a>
<br><strong>Studio snapshot is visible</strong>
<br><code>admin-console-route-map</code>
<br><strong>Route:</strong> <code>/studio</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/studio</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-studio</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-console-route-map/screenshots/03-studio-snapshot-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin dapat membuka studio snapshot untuk melihat ringkasan operasional cepat.
</td>
<td width="50%"></td>
</tr>
</table>

### Admin login and overview

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-login-overview/screenshots/01-admin-login-screen-is-ready.png"><img src="../artifacts/journeys/latest/admin-login-overview/screenshots/01-admin-login-screen-is-ready.png" alt="admin-login-overview - Admin login screen is ready" width="100%" /></a>
<br><strong>Admin login screen is ready</strong>
<br><code>admin-login-overview</code>
<br><strong>Route:</strong> <code>/login</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/login</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-login-screen-is-ready</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-login-overview/screenshots/01-admin-login-screen-is-ready.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Form login admin tampil dan siap dipakai.
</td>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-login-overview/screenshots/02-admin-reaches-the-overview-dashboard.png"><img src="../artifacts/journeys/latest/admin-login-overview/screenshots/02-admin-reaches-the-overview-dashboard.png" alt="admin-login-overview - Admin reaches the overview dashboard" width="100%" /></a>
<br><strong>Admin reaches the overview dashboard</strong>
<br><code>admin-login-overview</code>
<br><strong>Route:</strong> <code>/overview</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/overview</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>admin-reaches-the-overview-dashboard</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-login-overview/screenshots/02-admin-reaches-the-overview-dashboard.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin masuk ke overview dan melihat ringkasan order serta review queue.
</td>
</tr>
</table>

### Admin professional review queue

<table>
<tr>
<td width="50%" valign="top">
<a href="../artifacts/journeys/latest/admin-review-queue/screenshots/01-professional-review-queue-is-visible.png"><img src="../artifacts/journeys/latest/admin-review-queue/screenshots/01-professional-review-queue-is-visible.png" alt="admin-review-queue - Professional review queue is visible" width="100%" /></a>
<br><strong>Professional review queue is visible</strong>
<br><code>admin-review-queue</code>
<br><strong>Route:</strong> <code>/professionals</code>
<br><strong>URL:</strong> <code>http://admin.lvh.me:3005/professionals</code>
<br><strong>Persona:</strong> rani@ops.bidanapp.id / AdminDemo#2026
<br><strong>Viewport:</strong> <code>1280x720</code>
<br><strong>State:</strong> <code>professional-review-queue-is-visible</code>
<br><strong>Path:</strong> <code>artifacts/journeys/latest/admin-review-queue/screenshots/01-professional-review-queue-is-visible.png</code>
<br><strong>Status:</strong> passed
<br><strong>Note:</strong> Admin melihat antrean review profesional lengkap dengan dokumen dan catatan review.
</td>
<td width="50%"></td>
</tr>
</table>

