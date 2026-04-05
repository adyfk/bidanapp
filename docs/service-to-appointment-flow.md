# Service To Appointment Flow

Dokumen ini menjadi acuan tunggal untuk flow customer sampai profesional dari discovery layanan, booking, approval, pembayaran, delivery, sampai appointment selesai.

## Gate sebelum bisa dibooking

- Profesional mendaftar dan masuk dashboard pre-live dulu.
- Profesional belum bisa tampil ke customer sebelum lifecycle onboarding selesai:
  - `draft`
  - `ready_for_review`
  - `submitted`
  - `changes_requested`
  - `verified`
  - `published`
- Hanya profesional `published` yang boleh masuk katalog publik dan menerima booking customer.
- Agar layanan benar-benar bookable, profesional juga harus memenuhi syarat operasional:
  - minimal satu service offering aktif
  - mode layanan yang diminta customer memang aktif
  - coverage area dan radius valid untuk `home_visit`
  - hari dan slot aktif tersedia untuk mode offline

Referensi onboarding detail tetap ada di `docs/professional-onboarding-flow.md`. Dokumen ini melanjutkan lifecycle setelah profesional sudah melewati gate publish.

## Prinsip utama

- `appointments.json` adalah source of truth transaksi.
- Request board profesional bukan tabel transaksi kedua. Ia hanyalah projection dari appointment record.
- Data layanan saat order harus immutable. Harga, durasi, summary, mode, dan booking flow yang tampil di appointment lama tidak boleh berubah walaupun profesional mengubah offering sesudahnya.
- Negosiasi perubahan jadwal atau mode tetap terjadi di chat. Sistem transaksi formal tidak membuat domain `reschedule`; perubahan formal dilakukan dengan `cancel -> refund/void bila berlaku -> buat order baru`.
- CTA dari halaman service tidak boleh langsung membuat request. Semua order harus masuk lewat composer di halaman profesional agar validasi mode, coverage, dan slot selalu sama.
- `availabilityRulesByMode` di dashboard profesional adalah source of truth jam kerja offline yang boleh dilihat customer. Customer tidak boleh melihat tanggal atau jam di luar aturan mingguan dan penyesuaian hari khusus yang aktif.

## Source Of Truth

### Catalog dan offering

- `services.json`
  Master global service.
- `professional_service_offerings.json`
  Harga, durasi, booking flow, dan mode aktif per profesional.
- `professional_availability_weekly_hours.json`
  Jam kerja mingguan global per profesional untuk mode offline.
- `professional_availability_policies.json`
  Policy availability per profesional dan mode, termasuk `minimumNoticeHours` untuk memfilter booking yang terlalu mepet.
- `professional_cancellation_policies.json`
  Policy pembatalan per profesional dan mode, termasuk cutoff pembatalan customer setelah order dibayar.
- `professional_availability_date_overrides.json`
  Hari khusus untuk libur atau jam custom yang sementara menggantikan jam mingguan.

### Transaction

- `appointments.json`
  Menyimpan order final beserta snapshot immutable:
  - `serviceSnapshot`
  - `scheduleSnapshot`
  - `cancellationPolicySnapshot`
  - `cancellationResolution?`
  - `timeline`
  - `serviceOfferingId`
  - `bookingFlow`

## Flow customer ke profesional

### 1. Service discovery

1. Customer membuka katalog service.
2. Sistem mencari profesional yang punya `professional_service_offerings` untuk service itu.
3. Sistem menghitung mode yang valid:
   - `online`: selalu bisa bila offering mendukung.
   - `home_visit`: hanya muncul bila area customer ada di coverage dan masih masuk radius.
   - `onsite`: hanya butuh offering offline aktif.
4. CTA dari service detail hanya melakukan deep-link ke halaman profesional dengan `service` dan `mode` yang sudah dipreselect.

### 2. Professional booking composer

1. Halaman profesional menerima preselect `service` dan `mode`.
2. User memilih layanan dari daftar.
3. Sistem membuka dialog konfigurasi layanan.
4. Customer memilih atau mengubah mode yang masih valid.
5. Jika mode offline:
   - customer wajib memilih hari
   - customer wajib memilih slot
6. Setelah dialog disimpan, resume booking baru muncul di atas search dan sticky booking bar.
7. Composer membuat satu payload order:
   - `professionalId`
   - `serviceId`
   - `serviceOfferingId`
   - `requestedMode`
   - `scheduleDayId?`
   - `timeSlotId?`
   - `scheduledTimeLabel`
   - `note`

Catatan:

- `requestChannel` sengaja tidak disimpan di transaksi appointment karena sistem bisnis saat ini hanya punya satu entry path customer, yaitu app customer.
- Jika nanti benar-benar ada order omnichannel seperti admin-assisted atau WhatsApp-assisted, tambahkan field provenance baru seperti `orderSource` hanya saat alur operasionalnya memang berbeda dan perlu diaudit.

### 2a. Professional availability management

1. Profesional mengatur availability global di dashboard profesional, di tab `Booking Hours`.
2. Availability hanya relevan untuk mode offline:
   - `home_visit`
   - `onsite`
3. Profesional dapat mengelola:
   - hari kerja mingguan
   - `minimumNoticeHours` seperti `4 jam`, `12 jam`, atau `H-1`
   - hari khusus untuk libur atau jam custom sementara
4. Sistem otomatis menghasilkan pilihan tanggal dan jam customer dari aturan ini.
5. Appointment yang sudah dibuat tetap menyimpan `scheduleSnapshot` immutable saat order, jadi perubahan availability hanya memengaruhi order berikutnya.

### 3. Appointment creation

Saat tombol booking dikirim:

1. Sistem membaca `service` global dan `professional_service_offering` yang aktif saat itu.
2. Sistem membentuk `serviceSnapshot` immutable:
   - nama layanan
   - category
   - description
   - short description
   - image
   - cover image
   - tags
   - highlights
   - service modes
   - default mode
   - booking flow
   - service offering id
   - duration saat order
   - price saat order
   - summary saat order
3. Sistem membentuk `scheduleSnapshot` immutable:
   - `requiresSchedule`
   - `scheduledTimeLabel`
   - `dateIso?`
   - `scheduleDayId?`
   - `scheduleDayLabel?`
   - `timeSlotId?`
   - `timeSlotLabel?`
4. Sistem membentuk `cancellationPolicySnapshot` immutable dari policy profesional yang aktif saat order dibuat:
   - `customerPaidCancelCutoffHours`
   - `beforeCutoffOutcome`
   - `afterCutoffOutcome`
   - `professionalCancelOutcome`
5. Bila order nanti dibatalkan, sistem dapat menyimpan `cancellationResolution`:
   - `cancelledAt`
   - `cancelledBy`
   - `cancellationReason`
   - `financialOutcome`
6. Sistem membuat `timeline` awal sesuai booking flow.

## Booking flow matrix

### Request flow

- Entry state: `requested`
- Profesional review dulu.
- Setelah approve: `approved_waiting_payment`
- Setelah bayar: `paid`
- Setelah jadwal dikunci: `confirmed`
- Saat sesi mulai: `in_service`
- Setelah selesai: `completed`

### Instant flow

- Entry state: `approved_waiting_payment`
- Tidak ada approval manual profesional.
- Tetap wajib menunggu pembayaran sebelum bisa masuk `confirmed`.
- Setelah bayar: `paid`
- Setelah jadwal dikunci: `confirmed`
- Saat sesi mulai: `in_service`
- Setelah selesai: `completed`

## Transition rules

### Customer-side terminal / exception

- `rejected`
  Hanya valid dari `requested`.
- `expired`
  Hanya valid pada tahap menunggu pembayaran.
- `cancelled`
  Hanya valid untuk order yang ditutup eksplisit sebelum `in_service`.

### Cancel-centric change policy

- Sistem tidak menyediakan workflow reschedule formal.
- API transaksi juga tidak mengekspos endpoint `change-request`; perubahan formal tetap ditangani sebagai cancel lalu booking baru.
- Jika customer atau profesional ingin mengganti jadwal/mode/layanan, mereka berdiskusi di chat.
- Bila sepakat order lama tidak dilanjutkan:
  - order lama ditutup dengan `cancelled` atau `rejected`
  - jika nanti tetap jadi layanan, customer membuat order baru dari awal
- Customer boleh cancel pada:
  - `requested`
  - `approved_waiting_payment`
  - `paid`
  - `confirmed`
- Profesional boleh close request/order pada:
  - `requested` -> `rejected`
  - `approved_waiting_payment` -> `cancelled`
  - `paid` -> `cancelled`
  - `confirmed` -> `cancelled`
- Setelah `in_service`, tidak ada cancel atau reschedule in-app. Kasus itu menjadi jalur manual/support.
- Outcome finansial v1:
  - customer cancel `requested` -> `cancelled` + `none`
  - customer/professional cancel `approved_waiting_payment` -> `cancelled` + `void_pending_payment`
  - customer cancel `paid` atau `confirmed` sebelum cutoff -> `cancelled` + `full_refund`
  - customer cancel `paid` atau `confirmed` sesudah cutoff -> `cancelled` + `no_refund`
  - professional cancel `paid` atau `confirmed` -> `cancelled` + `full_refund`

### Professional-side projection

Projection request board:

- `requested` -> `new`
- `approved_waiting_payment` / `paid` -> `quoted`
- `confirmed` / `in_service` -> `scheduled`
- `completed` / `cancelled` / `rejected` / `expired` -> `completed`

Rule penting:

- Profesional tidak boleh memindahkan `quoted -> scheduled` bila customer masih `approved_waiting_payment`.
- Timeline appointment tetap mencatat event pembayaran walaupun request board tetap berada di status `quoted`.

## Data invariants

- Appointment detail dan appointment list wajib membaca data service dari `serviceSnapshot`, bukan `services.json`.
- Professional request cards wajib membaca nama/summary service dari appointment projection, bukan lookup katalog live.
- Perubahan harga atau durasi di dashboard profesional tidak boleh mengubah appointment yang sudah pernah dibuat.
- Satu order selalu menghasilkan satu appointment record baru. Riwayat order lama tidak ditimpa.

## Case coverage

### Online

- Tidak butuh coverage area.
- Tidak butuh `scheduleDayId` atau `timeSlotId`.
- Tetap boleh menyimpan `scheduledTimeLabel` bila ada slot waktu live class atau session window.

### Home visit

- Wajib lolos coverage area.
- Wajib lolos radius home visit.
- Wajib pilih hari dan slot offline.

### Onsite

- Tidak butuh coverage radius customer.
- Tetap wajib pilih hari dan slot offline.

## Fixture matrix

Fixture seed yang saat ini dipakai untuk menjaga alignment flow:

- `online + instant` -> `apt-003`, `apt-006`, `apt-009`
- `online + request` -> `apt-010`
- `home_visit + instant` -> `apt-011`
- `home_visit + request` -> `apt-001`, `apt-002`, `apt-004`, `apt-005`, `apt-008`
- `onsite + instant` -> `apt-007`
- `onsite + request` -> `apt-012`

Integrity contract untuk fixture ini dijaga oleh `apps/frontend/tests/appointment-flow-contract.test.mjs`.

## UI alignment

- Service detail: discovery only.
- Professional detail: booking composer tunggal.
- Appointments screen: tampilkan `serviceSnapshot`, `scheduleSnapshot`, `requestNote`, dan status transaction.
- Appointments screen: tampilkan outcome pembatalan, policy pembatalan, dan CTA `book again` untuk order yang sudah ditutup.
- Professional dashboard requests: tampilkan projection dari appointment timeline, plus CTA reject/cancel tanpa workflow approval dua pihak.

## Arah backend

Saat fixture ini dipindah penuh ke backend, kontrak minimal yang harus dipertahankan:

- appointment create request harus cukup untuk membentuk snapshot immutable
- appointment response harus mengembalikan snapshot immutable
- projection request board profesional sebaiknya dibangun dari appointment event/timeline, bukan disimpan sebagai tabel transaksi terpisah
