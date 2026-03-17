# Mock DB Blueprint

Folder ini adalah abstraksi dummy database sebelum migrasi ke PostgreSQL. Semua data sekarang dipecah per tabel JSON, bukan lagi per `simulation object` besar.

## Tujuan

- Membuat seed data lebih dekat ke desain relational database.
- Memisahkan entity inti, relasi, lookup table, dan state reference.
- Menyediakan dasar yang lebih jelas untuk nanti dipindahkan ke PostgreSQL, `sqlc`, atau ORM.
- Menjaga frontend tetap bisa meng-hydrate object domain yang sama walaupun sumber datanya sudah ternormalisasi.

## Struktur Tabel

### Runtime aplikasi

- Konfigurasi aplikasi seperti branding dan theme tidak disimpan di `mock-db`.
  Wording UI hidup di locale file, sedangkan constant code hanya menyimpan config non-domain yang memang statis.
- `app_runtime_selections.json`
  Menyimpan pointer ke seed aktif yang dipakai aplikasi saat boot: consumer aktif, context aktif, home feed aktif, dan media preset aktif.
- `app_section_configs.json`
  Menyimpan konfigurasi section-level untuk halaman seperti home, misalnya kategori yang ditampilkan atau profesional unggulan.

### Reference dan state lookup

- `reference_service_delivery_modes.json`
  Master data mode layanan: `online`, `home_visit`, `onsite`. Berguna sebagai enum referensi dan penjelasan constraint bisnis.
- `reference_booking_flows.json`
  Master data flow booking: `instant` atau `request`. Ini menentukan apakah sebuah offering perlu approval dan pembayaran sebelum lanjut.
- `reference_time_slot_statuses.json`
  Master data status slot: `available`, `limited`, `booked`. Dipakai oleh schedule selector.
- `reference_appointment_statuses.json`
  Master data lifecycle appointment. Ini adalah kandidat kuat untuk enum atau status transition table di PostgreSQL.

### Katalog inti

- `areas.json`
  Master area geografis yang dipakai untuk coverage, context user, dan alamat praktik.
- `service_categories.json`
  Kategori layanan untuk grouping katalog dan filtering.
- `services.json`
  Layanan global yang bisa ditawarkan banyak profesional. Entitas ini tidak menyimpan harga per profesional.
- `professionals.json`
  Data inti profesional: identitas, rating, badge, availability, image, response time, dan deskripsi utama.
- `professional_specialties.json`
  Label specialty profesional. Dipisah supaya nanti bisa diquery dan diindex secara independen.
- `professional_languages.json`
  Bahasa yang dikuasai profesional. Dipisah agar bisa menjadi filter pencarian.
- `professional_practice_locations.json`
  Titik layanan fisik profesional. Ini kandidat kuat untuk tabel alamat atau `practice_locations`.
- `professional_coverage_policies.json`
  Policy home visit profesional: radius kunjungan dan titik pusat coverage.
- `professional_coverage_areas.json`
  Join table coverage area. Satu profesional bisa melayani beberapa area.
- `professional_service_offerings.json`
  Join table profesional ke layanan. Di sinilah harga, durasi, mode aktif, default mode, booking flow, dan summary per profesional disimpan.
- `professional_availability_schedule_days.json`
  Hari booking global per profesional dan mode offline. Ini menjadi source of truth tunggal untuk jadwal customer-facing.
- `professional_availability_time_slots.json`
  Slot waktu per hari booking profesional. Ini adalah kandidat tabel `availability_slots` dengan foreign key ke `availability_days`.

### Trust, portfolio, dan social proof profesional

- `professional_portfolio_stats.json`
  Angka ringkas untuk membangun trust card profesional.
- `professional_credentials.json`
  Sertifikasi, lisensi, dan dokumen legal profesional.
- `professional_activity_stories.json`
  Dokumentasi aktivitas singkat yang tampil seperti story feed.
- `professional_portfolio_entries.json`
  Portofolio tindakan atau layanan yang pernah dikerjakan.
- `professional_gallery_items.json`
  Galeri visual profesional.
- `professional_testimonials.json`
  Testimoni keluarga atau pasien. Ini kandidat tabel review curated.
- `professional_feedback_summaries.json`
  Ringkasan feedback agregat profesional, misalnya repeat client rate.
- `professional_feedback_metrics.json`
  KPI feedback tambahan yang dipakai di UI detail profesional.
- `professional_feedback_breakdowns.json`
  Breakdown rating atau feedback ke dalam bucket persentase.
- `professional_recent_activities.json`
  Aktivitas terbaru profesional untuk membentuk persepsi freshness dan aktivitas operasional.

### Consumer context dan komposisi UI

- `consumers.json`
  Data pengguna dummy yang bertindak sebagai customer aplikasi.
- `user_contexts.json`
  Context aktif pengguna: area terpilih, koordinat user, dan label online status.
- `home_feed_snapshots.json`
  Snapshot komposisi home untuk satu consumer dan satu context. Ini bukan transaksi, tapi hasil kurasi feed.
- `home_feed_featured_appointments.json`
  Highlight appointment yang ditampilkan di home feed.
- `home_feed_popular_services.json`
  Join table layanan populer pada suatu home feed.
- `home_feed_nearby_professionals.json`
  Join table profesional sekitar pada suatu home feed.
- `media_presets.json`
  Preset asset visual untuk onboarding, cover service detail, dan background map.
- Wording UI tidak disimpan di `mock-db`.
  Semua teks UI sekarang memakai locale file [en.json](/Users/adi/Code/startup/bidanapp/apps/frontend/messages/en.json) dan [id.json](/Users/adi/Code/startup/bidanapp/apps/frontend/messages/id.json), jadi tidak ada preset wording atau pseudo CMS layer di database dummy.

### Transaksi dan komunikasi

- `appointments.json`
  Entitas transaksi utama. Row ini menghubungkan consumer, profesional, service, dan state appointment.
  Row appointment sekarang menyimpan `serviceSnapshot`, `scheduleSnapshot`, `timeline`, `serviceOfferingId`, dan `bookingFlow` agar harga, durasi, summary, serta mode saat order tetap immutable walaupun offering profesional berubah setelah order dibuat.
- `chat_threads.json`
  Thread komunikasi antara consumer dan profesional. Bisa bertipe `direct` atau `appointment`.
- `chat_messages.json`
  Pesan individual dalam thread. Ini kandidat tabel event/append-only untuk messaging.

### Manifest

- `table_manifest.json`
  Daftar seluruh tabel seed beserta jumlah row. Berguna untuk audit cepat saat generator dijalankan.

## Relasi Inti

- `services` 1:N `professional_service_offerings`
- `professionals` 1:N `professional_service_offerings`
- `professionals` 1:N `professional_availability_schedule_days`
- `professional_availability_schedule_days` 1:N `professional_availability_time_slots`
- `professionals` 1:N hampir semua tabel trust dan portofolio
- `areas` 1:N `user_contexts`
- `areas` N:M `professionals` melalui `professional_coverage_areas`
- `consumers` 1:N `appointments`
- `appointments` 1:N `chat_threads` untuk thread bertipe appointment
- `chat_threads` 1:N `chat_messages`

## Flow Domain

### 1. Discovery dan home feed

1. Aplikasi membaca `app_runtime_selections.json` untuk memilih consumer dan context aktif.
2. `home_feed_snapshots.json` menentukan komposisi feed yang harus dipakai.
3. Join table `home_feed_popular_services.json` dan `home_feed_nearby_professionals.json` menyusun isi kartu home.
4. `app_section_configs.json` menjadi override tambahan untuk urutan kategori atau profesional unggulan.

### 2. Browse profesional dan coverage

1. User memilih layanan.
2. Sistem mencari `professional_service_offerings` yang cocok.
3. Untuk mode `home_visit`, sistem mengecek dua lapis constraint:
   - area user harus ada di `professional_coverage_areas`
   - jarak user ke `professional_coverage_policies.center` harus berada dalam `homeVisitRadiusKm`
4. Jika lolos, mode `home_visit` boleh ditampilkan sebagai bookable.

### 3. Booking flow

1. Consumer memilih `service`, `professional`, dan `delivery mode`.
2. CTA dari service detail tidak langsung membuat request. CTA selalu diarahkan ke halaman profesional agar semua booking memakai composer yang sama.
3. Jika mode offline, sistem membaca `professional_availability_schedule_days` lalu `professional_availability_time_slots`.
4. Saat order dibuat, sistem menyimpan `serviceSnapshot`, `scheduleSnapshot`, dan `timeline` awal langsung ke `appointments.json`.
5. Jika offering memakai `bookingFlow = request`, booking masuk state `requested`.
6. Jika offering memakai `bookingFlow = instant`, booking langsung masuk `approved_waiting_payment` tanpa approval manual, tetapi tetap menunggu pembayaran.
7. Setelah pembayaran berhasil, booking masuk `paid`, lalu `confirmed`, lalu `in_service`.
8. Setelah layanan selesai, booking masuk `completed`.

### 4. Payment dan closure

- Jika pembayaran tidak selesai sesuai SLA, booking masuk `expired`.
- Jika profesional menolak request, booking masuk `rejected`.
- Jika salah satu pihak membatalkan sesi, booking masuk `cancelled`.

### 5. Chat flow

1. Thread dapat dibuka langsung (`direct`) atau terikat ke appointment (`appointment`).
2. Semua pesan disimpan di `chat_messages`.
3. Appointment chat bisa dipakai sejak sebelum sesi berjalan sampai sesi selesai, tergantung policy produk.

### 6. Review dan trust loop

1. Setelah `appointments.status = completed`, UI mengaktifkan flow review.
2. Review copy dan helper text diambil dari locale config, bukan dari mock database.
3. Hasil review nyata nanti idealnya masuk tabel baru seperti `professional_reviews`.
4. Agregasinya kemudian bisa memperbarui `professional_feedback_summaries`, `professional_feedback_metrics`, dan `professional_feedback_breakdowns`.

## State Model

### Service delivery mode

- `online`
  Tidak butuh coverage fisik dan tidak butuh slot offline.
- `home_visit`
  Butuh coverage area dan radius home visit.
- `onsite`
  Butuh slot offline, tetapi tidak terikat radius user.

### Booking flow

- `instant`
  Cocok untuk layanan yang tidak butuh review manual, tetapi tetap harus melewati pembayaran sebelum `confirmed`.
- `request`
  Cocok untuk layanan yang membutuhkan approval profesional atau validasi kesiapan.

### Time slot status

- `available`
  Slot masih aman untuk dipesan.
- `limited`
  Slot masih terbuka tetapi kapasitas menipis.
- `booked`
  Slot tidak lagi dapat dipilih.

### Appointment status lifecycle

- `requested`
  State awal setelah consumer mengirim request.
- `approved_waiting_payment`
  Profesional menerima booking, sistem menunggu pembayaran.
- `paid`
  Pembayaran selesai, tetapi sesi belum tentu dimulai.
- `confirmed`
  Appointment sudah terkunci dan siap dilayani.
- `in_service`
  Layanan sedang berjalan.
- `completed`
  Layanan selesai. State terminal operasional dan pintu masuk ke review.
- `cancelled`
  Booking dibatalkan.
- `rejected`
  Booking ditolak profesional.
- `expired`
  Booking gugur otomatis karena timeout atau rule lain.

## Rekomendasi Mapping ke PostgreSQL

- Jadikan `service_delivery_mode`, `booking_flow`, `time_slot_status`, dan `appointment_status` sebagai enum atau reference table.
- Gunakan foreign key eksplisit untuk semua join table.
- Tambahkan index minimal pada:
  - `professional_service_offerings.professionalId`
  - `professional_service_offerings.serviceId`
  - `appointments.consumerId`
  - `appointments.professionalId`
  - `appointments.status`
  - `chat_messages.threadId`
  - `professional_availability_time_slots.scheduleDayId`
- Pertimbangkan unique constraint pada:
  - `(professionalId, serviceId)` di `professional_service_offerings`
  - `(professionalId, areaId)` di `professional_coverage_areas`
- Tabel presentasional murni seperti `media_presets` bisa tetap berupa JSONB atau config file jika ingin backend awal tetap sederhana.

## Catatan Desain

- Struktur ini memang lebih verbose daripada `simulation object`, tetapi jauh lebih aman untuk evolusi schema.
- Hydration ke object frontend sekarang dipusatkan di [catalog.ts](/Users/adi/Code/startup/bidanapp/apps/frontend/src/lib/mock-db/catalog.ts), [appointments.ts](/Users/adi/Code/startup/bidanapp/apps/frontend/src/lib/mock-db/appointments.ts), [chat.ts](/Users/adi/Code/startup/bidanapp/apps/frontend/src/lib/mock-db/chat.ts), dan [runtime.ts](/Users/adi/Code/startup/bidanapp/apps/frontend/src/lib/mock-db/runtime.ts).
- Jika nanti benar-benar masuk PostgreSQL, folder ini bisa diganti seed SQL atau fixtures per tabel tanpa perlu kembali ke `simulation object`.
