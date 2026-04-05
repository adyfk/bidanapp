# Professional Onboarding Flow

Dokumen ini merangkum flow onboarding profesional yang sekarang berjalan di runtime aktif, dengan acuan fitur frontend dan backend yang sudah sinkron serta tanpa fallback ke profil seed lain untuk akun baru.

## Ringkasan Kondisi Existing

Sumber state profesional saat ini ada di:

- `apps/frontend/src/lib/use-professional-portal.ts`
- `apps/frontend/src/features/professional-portal/lib/contracts.ts`
- `apps/frontend/src/components/screens/ProfessionalAccessScreen.tsx`
- `apps/frontend/src/components/screens/ProfessionalProfileScreen.tsx`
- `apps/frontend/src/components/screens/professional-dashboard/*`

Fitur editable yang sudah ada dan bisa dipakai untuk onboarding:

- profil akun: `displayName`, `phone`, `city`, `credentialNumber`, `publicBio`, `responseTimeGoal`
- coverage operasional: `coverageAreaIds`, `practiceLabel`, `practiceAddress`, `homeVisitRadiusKm`, `coverageCenter`
- layanan: `serviceConfigurations`
- portofolio: `portfolioEntries`, `galleryItems`
- trust milik profesional: `credentials`, `activityStories`

Status implementasi sekarang:

1. Register profesional sudah punya lifecycle eksplisit `draft -> ready_for_review -> submitted -> changes_requested|verified -> published`.
2. Jalur submit ke admin, review admin, dan publish sudah dimodelkan dan dipersist ke backend.
3. `acceptingNewClients` tetap diperlakukan sebagai switch operasional intake, bukan lifecycle approval.
4. Gate submit/live memakai checklist onboarding yang diturunkan dari state portal, bukan skor ringkas tunggal.
5. Draft profesional baru sudah dibersihkan dari warisan profil publik seeded lain, sehingga onboarding akun baru dimulai dari state yang realistis.

## Flow Yang Disarankan

### 1. Entry

1. User buka `/for-professionals`
2. User register
3. Session berubah ke mode professional
4. User masuk ke dashboard
5. Dashboard langsung menampilkan status `Belum aktif / belum live`

### 2. Lengkapi Profil

Dashboard pre-live menampilkan:

- status lifecycle saat ini
- progress onboarding
- checklist per section
- CTA ke tab yang belum lengkap

Section yang dipakai dari fitur existing:

- `Profile`: identitas, credential, bio, pengalaman
- `Coverage`: area, alamat praktik, target respons
- `Services`: minimal 1 layanan aktif + 1 layanan unggulan
- `Booking Hours`: minimal 1 hari kerja mingguan bila mode offline aktif, plus atur batas booking terakhir sesuai operasional
- `Portfolio`: minimal 1 portofolio publik

Catatan:

- `Trust` tidak dijadikan blocker onboarding.
- profesional sekarang bisa mengelola `credentials` dan `activityStories` dari dashboard trust.
- `feedback` dan `testimonials` tetap read-only karena sumbernya berasal dari pelanggan dan histori layanan.

### 3. Submit Ke Admin

Saat semua blocker selesai:

1. state berubah dari `draft` ke `ready_for_review`
2. CTA utama berubah menjadi `Ajukan ke admin`
3. setelah submit, state menjadi `submitted`
4. profile tetap belum live

### 4. Review Admin

Admin punya dua outcome:

- `changes_requested`
- `verified`

Jika `changes_requested`:

- dashboard menampilkan catatan admin
- section yang harus diperbaiki di-highlight
- CTA berubah menjadi `Perbaiki dan ajukan ulang`

Jika `verified`:

- profesional lolos verifikasi
- profile masih belum live sampai dipublish

### 5. Publish

Setelah `verified`:

1. admin atau ops publish profile
2. state menjadi `published`
3. profile muncul di katalog publik
4. request board baru benar-benar masuk akal dipakai untuk operasional live

## Lifecycle State

Gunakan state berikut, bukan boolean tunggal:

| State | Makna | Publik | CTA utama |
| --- | --- | --- | --- |
| `draft` | Baru register atau masih ada blocker onboarding | Tidak | Lengkapi profil |
| `ready_for_review` | Semua blocker selesai, siap diajukan | Tidak | Ajukan ke admin |
| `submitted` | Menunggu review admin | Tidak | Lihat status review |
| `changes_requested` | Admin minta revisi | Tidak | Perbaiki dan ajukan ulang |
| `verified` | Admin menyetujui | Tidak | Menunggu publish |
| `published` | Sudah live | Ya | Kelola operasional |

## State Halaman Yang Disarankan

### A. Dashboard pre-live

State ini dipakai tepat setelah register, sesuai kebutuhan user masuk dashboard dulu.

Komponen yang muncul:

- status badge: `Belum aktif`
- summary card: progress onboarding + blocker count
- checklist per section
- CTA ke section prioritas
- preview publik tetap boleh dilihat, tapi diberi label `Preview`

Varian state:

- `onboarding_empty`
  Cocok untuk akun baru yang baru isi data minimum saat register.
- `onboarding_in_progress`
  Sudah ada progres tapi belum siap submit.
- `ready_for_review`
  Semua blocker selesai dan tinggal submit.
- `awaiting_admin_review`
  Sudah diajukan dan sedang dicek admin.
- `changes_requested`
  Ada catatan admin dan perlu revisi.
- `verified_pending_publish`
  Lolos admin tetapi belum live.
- `live`
  Kembali ke dashboard operasional normal.

### B. Requests tab

Untuk account yang belum `published`, requests sebaiknya jangan jadi tab utama operasional.

Pilihan implementasi:

1. Tetap boleh dibuka, tapi isi state empty dengan pesan `Belum live, lengkapi profil dulu`
2. Atau arahkan user ke summary onboarding ketika belum `published`

### C. Notifications

Notification professional yang sudah ada bisa dipakai juga untuk onboarding:

- layanan belum aktif
- area coverage belum ada
- intake dimatikan

Tambahan notifikasi yang sebaiknya ada:

- pengajuan sedang direview admin
- revisi diminta admin
- verifikasi selesai, tinggal publish

## Checklist Blocking vs Recommended

Blocking untuk submit:

- nama profesional
- nomor WhatsApp
- kota domisili
- nomor STR / SIP
- lama pengalaman
- bio publik
- label lokasi praktik
- alamat praktik
- minimal 1 area jangkauan
- target waktu respons
- jika home visit aktif: radius home visit
- minimal 1 layanan aktif yang sudah terisi
- minimal 1 mode layanan aktif dari konfigurasi layanan
- jika layanan offline aktif: minimal 1 hari kerja mingguan pada mode yang dibuka
- 1 layanan unggulan
- minimal 1 portofolio publik

Recommended, tetapi tidak memblok submit:

- galeri profil

Catatan domain:

- `Coverage` hanya menyimpan jangkauan, titik pusat, alamat praktik, dan switch operasional.
- mode layanan aktif tetap melekat di layanan, sedangkan jam kerja offline dikelola global di `availabilityRulesByMode` agar seed data tidak redundan.
- source of truth untuk waktu booking ada di `availabilityRulesByMode`, termasuk `minimumNoticeHours`, bukan di tiap service configuration.

## Strategi State Yang Tidak Redundan

Prinsipnya:

1. Jangan buat tabel baru untuk services, coverage, portfolio, atau profile fields yang sudah ada di `ProfessionalPortalState`.
2. Tambahkan seed data hanya untuk persona QA dan published read model yang memang dibutuhkan.
3. Derive checklist dan progress dari state existing, jangan simpan ulang dalam JSON lain.

Implementasi yang sudah disiapkan:

- `apps/frontend/src/features/professional-portal/lib/onboarding.ts`

Isi helper tersebut:

- `createProfessionalOnboardingDraft(...)`
  Membersihkan state awal agar akun baru tidak langsung terlihat seperti profesional yang sudah live.
- `deriveProfessionalOnboardingState(...)`
  Menghasilkan state halaman onboarding dari `ProfessionalPortalState` existing.
- `PROFESSIONAL_LIFECYCLE_REVIEW_STATE_TEMPLATES`
  Template status review untuk persona seeded dan fallback terkontrol tanpa menduplikasi data profil.

## Kondisi Draft Registrasi Saat Ini

Registrasi profesional sekarang tidak lagi menurunkan data publik dari profil seeded lain. Akun baru tidak langsung terlihat seperti sudah:

- punya layanan aktif
- punya portofolio
- punya gallery
- punya request board
- siap tampil publik

Untuk flow onboarding, itu memang harus dihindari. Karena itu draft registrasi sekarang:

- menyimpan hanya identitas minimum hasil register
- mengubah layanan existing menjadi template non-aktif
- mengosongkan portfolio, gallery, coverage, dan request board
- memaksa user melengkapi sendiri data yang benar-benar dibutuhkan untuk live

## Wiring Yang Disarankan

1. Setelah register, arahkan ke dashboard.
2. Dashboard hitung onboarding state via `deriveProfessionalOnboardingState(...)`.
3. Jika status belum `published`, render hero onboarding, bukan hero operasional penuh.
4. Saat user submit, simpan hanya metadata review admin:
   - `status`
   - `submittedAt`
   - `reviewedAt`
   - `reviewerName`
   - `adminNote`
5. Publish hanya boleh terjadi setelah `verified`.

## Batas Tanggung Jawab Data

- `ProfessionalPortalState` tetap jadi source of truth untuk data yang diedit profesional.
- `credentials` dan `activityStories` dikelola profesional dari dashboard trust lalu diproyeksikan ke profil publik.
- `feedback`, `feedbackSummary`, `feedbackBreakdown`, dan `testimonials` tetap jadi read-only trust layer yang berasal dari pelanggan atau agregasi sistem.
- lifecycle admin review disimpan terpisah sebagai metadata kecil.
- public catalog tetap diturunkan dari state yang sudah `published`, bukan dari draft mentah.
