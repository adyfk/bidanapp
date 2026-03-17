# Professional Onboarding Flow

Dokumen ini merangkum flow profesional yang lebih rapi untuk kondisi saat ini, dengan acuan fitur yang sudah ada di frontend dan tanpa menduplikasi data mock yang sebenarnya sudah tersedia.

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

Gap utama dari implementasi sekarang:

1. Register belum punya lifecycle profesional yang eksplisit.
2. Status non-live, submit ke admin, hasil review admin, dan publish belum dimodelkan.
3. `acceptingNewClients` bukan status lifecycle. Itu hanya switch operasional intake.
4. `profileCompletionScore` hanya skor ringkas, belum cukup untuk jadi gate submit/live.
5. Draft profesional baru masih mewarisi data demo publik dari profesional existing, sehingga kurang cocok untuk simulasi onboarding realistis.

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
- `Booking Hours`: minimal 1 hari dan slot bila mode offline aktif
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
- jika layanan offline aktif: minimal 1 hari dan slot bookable pada mode yang dibuka
- 1 layanan unggulan
- minimal 1 portofolio publik

Recommended, tetapi tidak memblok submit:

- galeri profil

Catatan domain:

- `Coverage` hanya menyimpan jangkauan, titik pusat, alamat praktik, dan switch operasional.
- mode layanan aktif tetap melekat di layanan, sedangkan slot waktu offline dikelola global di `availabilityByMode` agar mock-data tidak redundan.
- source of truth untuk waktu booking ada di `availabilityByMode`, bukan di tiap service configuration.

## Strategi Mock Yang Tidak Redundan

Prinsipnya:

1. Jangan buat tabel baru untuk services, coverage, portfolio, atau profile fields yang sudah ada di `ProfessionalPortalState`.
2. Tambahkan data mock hanya untuk lifecycle review admin.
3. Derive checklist dan progress dari state existing, jangan simpan ulang dalam JSON lain.

Implementasi yang sudah disiapkan:

- `apps/frontend/src/features/professional-portal/lib/onboarding.ts`

Isi helper tersebut:

- `createProfessionalOnboardingDraft(...)`
  Membersihkan state demo agar akun baru tidak langsung terlihat seperti profesional yang sudah live.
- `deriveProfessionalOnboardingState(...)`
  Menghasilkan state halaman onboarding dari `ProfessionalPortalState` existing.
- `PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS`
  Mock minimal untuk state admin review tanpa menduplikasi data profil.

## Kenapa Draft Perlu Dibersihkan

Saat ini registrasi profesional masih menurunkan banyak data dari profil demo existing. Akibatnya akun baru langsung terlihat seperti sudah:

- punya layanan aktif
- punya portofolio
- punya gallery
- punya request board
- siap tampil publik

Untuk flow onboarding, itu menyesatkan. Karena itu draft registrasi sebaiknya:

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
