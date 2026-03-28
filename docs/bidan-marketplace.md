# Bidan Marketplace

Dokumen ini adalah analisis produk berdasarkan fitur, route, domain backend, dan seed data yang sudah ada di repository saat ini. Tujuannya bukan membuat visi imajiner yang lepas dari implementasi, tetapi merangkum apa yang benar-benar sedang dibangun oleh sistem.

## 1. Deskripsi Singkat

`Bidan Marketplace` adalah platform marketplace layanan kesehatan dan perawatan terlokalisasi yang mempertemukan pelanggan dengan tenaga profesional untuk mencari layanan, memvalidasi kecocokan layanan, melakukan booking, memantau status appointment, berkomunikasi via chat, dan menyelesaikan isu operasional dalam satu alur terpadu.

Dari implementasi yang ada saat ini, produk ini bukan hanya katalog bidan. Ia sudah bergerak menjadi marketplace layanan care-at-home dan care coordination dengan inti yang paling kuat pada kebutuhan ibu, bayi, nifas, laktasi, dan keluarga muda, lalu diperluas ke layanan pendamping seperti terapi rumah, relaksasi, wellness, dan rehabilitasi.

## 2. Ringkasan Analisis

Secara produk, yang sedang dibangun adalah `managed multi-sided marketplace`, bukan listing directory biasa.

Artinya, platform ini sudah memiliki tiga lapisan utama:

- `Demand layer`: visitor dan customer menemukan layanan, memilih profesional, dan membuat booking.
- `Supply layer`: profesional mengelola layanan, availability, coverage, trust, portfolio, dan request.
- `Control layer`: admin memverifikasi supply, memantau transaksi, menangani support, dan menjaga kualitas operasi.

Nilai utama sistem ini ada pada kemampuannya mengubah pencarian layanan yang biasanya berlangsung manual, tersebar di chat, dan penuh ketidakpastian menjadi alur yang lebih terstruktur, tervalidasi, dan dapat diaudit.

## 3. Fokus Produk

Fokus produk yang paling jelas dari fitur saat ini adalah:

- menghubungkan keluarga atau individu dengan tenaga profesional yang relevan berdasarkan layanan, area, mode layanan, dan kesiapan operasional
- membuat layanan home visit, onsite, dan online bisa dipilih dengan aturan yang valid
- memastikan profesional yang tampil publik sudah melewati lifecycle onboarding dan review
- menyediakan alur operasional penuh setelah booking, bukan berhenti di lead generation
- memberi admin visibility untuk quality control, support, dan stabilitas marketplace

Jika diringkas dalam satu kalimat:

> Fokus `Bidan Marketplace` adalah membangun marketplace layanan bidan dan care-at-home yang tepercaya, terlokalisasi, dan operasionalnya bisa dikendalikan dari discovery sampai layanan selesai.

## 4. Masalah Yang Ingin Diselesaikan

### Masalah di sisi customer

- Sulit menemukan tenaga profesional yang cocok, dekat, dan benar-benar bisa melayani mode yang dibutuhkan.
- Informasi layanan sering terpisah dari ketersediaan jadwal dan area coverage.
- Booking manual lewat chat membuat status layanan, pembayaran, dan tindak lanjut tidak jelas.
- Sulit menilai trust profesional hanya dari listing singkat.
- Setelah booking dibuat, pelanggan butuh tempat untuk melihat status, timeline, notifikasi, dan komunikasi.

### Masalah di sisi profesional

- Profesional butuh storefront digital yang bukan hanya profil, tetapi juga bisa mengelola layanan, harga, mode, jadwal, jangkauan, dan bukti kepercayaan.
- Permintaan masuk sering tidak tersusun sehingga sulit dikelola sebagai pipeline kerja.
- Profesional perlu jalur onboarding yang jelas sebelum tampil publik.
- Profesional butuh pemisahan antara profile setup, operasional booking, dan pembuktian trust.

### Masalah di sisi operator atau admin

- Marketplace butuh kontrol kualitas supply sebelum profesional tampil ke publik.
- Support ticket perlu terhubung dengan konteks customer, appointment, dan profesional.
- Appointment, katalog, dan data runtime perlu dapat diinspeksi tanpa masuk ke database secara manual.
- Operasi marketplace memerlukan console, bukan sekadar CMS statis.

## 5. Visi

Menjadi infrastruktur marketplace layanan bidan dan care-at-home yang paling tepercaya untuk keluarga modern, dengan pengalaman pencarian, booking, dan koordinasi layanan yang mudah, aman, dan transparan.

## 6. Misi

- Mempermudah keluarga menemukan layanan profesional yang relevan, dekat, dan siap melayani.
- Membantu tenaga profesional mengubah keahlian menjadi layanan yang bisa dijual, dijadwalkan, dan dikelola dengan rapi.
- Menjaga kualitas marketplace lewat onboarding, review, publish gate, dan admin operations.
- Menyatukan discovery, booking, status layanan, chat, notifikasi, dan support dalam satu produk.
- Membangun trust melalui profil profesional yang kaya, credential, portfolio, activity story, dan aturan operasional yang jelas.

## 7. Tujuan Produk

### Tujuan jangka dekat

- menaikkan konversi dari discovery ke booking yang valid
- memastikan hanya profesional yang siap operasional yang bisa tampil publik
- membuat home visit, onsite, dan online booking berjalan dengan aturan yang konsisten
- mengurangi friksi koordinasi setelah booking dibuat
- memberi admin alat untuk menjaga kualitas supply dan menyelesaikan isu layanan

### Tujuan jangka menengah

- membangun flywheel marketplace antara supply berkualitas, discovery yang relevan, dan repeat booking
- memperluas kategori layanan yang masih berdekatan dengan positioning utama ibu, bayi, keluarga, dan homecare
- menjadikan platform sebagai sistem operasi layanan, bukan hanya etalase profesional

## 8. Kenapa Judul "Bidan Marketplace" Masih Relevan

Walaupun implementasi saat ini sudah memuat layanan yang lebih luas dari bidan murni, tulang punggung positioning produk tetap paling kuat di area berikut:

- newborn care
- postpartum atau nifas
- konsultasi laktasi
- tumbuh kembang
- kebutuhan keluarga muda berbasis homecare

Nama `Bidan Marketplace` masih relevan jika strategi brand ingin tetap menonjolkan trust, kedekatan, dan otoritas pada fase ibu dan anak, lalu memperluas supply ke layanan pendukung yang masih satu ekosistem.

Namun, analisis fitur juga menunjukkan satu catatan strategis penting:

- secara brand, produk masih terasa `bidan-first`
- secara supply, produk sudah bergerak ke `broader localized care marketplace`

Ini bukan masalah, tetapi keputusan positioning ke depan perlu jelas agar narasi produk, akuisisi supply, dan ekspektasi pengguna tetap selaras.

## 9. Model Marketplace Yang Sedang Dibangun

| Aspek | Bentuk saat ini |
| --- | --- |
| Tipe marketplace | multi-sided service marketplace |
| Demand | visitor, customer authenticated |
| Supply | professional dengan lifecycle onboarding |
| Operator | admin console dan support desk |
| Delivery mode | `online`, `home_visit`, `onsite` |
| Booking flow | `instant`, `request` |
| Pusat transaksi | halaman detail profesional |
| Komunikasi | realtime chat berbasis thread appointment |
| Support recovery | support ticket dan admin triage |

Insight paling penting dari implementasi saat ini:

- halaman service bersifat `discovery`
- halaman profesional bersifat `transactional`

Artinya, ekonomi marketplace benar-benar dipusatkan di halaman profesional, karena di sanalah layanan, mode, coverage, availability, dan aksi booking divalidasi bersama.

## 10. Capability Yang Sudah Terlihat Dari Fitur

### A. Public dan visitor layer

Fitur yang sudah hidup:

- home feed dengan nearby professionals, popular services, featured appointment, dan quick re-entry
- explore screen dengan search, filter, kategori, gender, favorit, dan resolusi lokasi
- service catalog
- service detail
- professional detail
- locale-aware public routing

Makna produk:

- platform sudah memikirkan discovery dengan konteks lokasi
- supply tidak ditampilkan sebagai list statis, tetapi sebagai inventory yang relevan dengan area dan layanan
- pengguna bisa masuk dari sudut `service-first` atau `professional-first`

### B. Customer layer

Fitur yang sudah hidup:

- login, register, continue as visitor
- booking composer dari halaman profesional
- appointments list dan appointment detail
- activity timeline
- realtime chat
- notifications
- profile, password, language, dan support

Makna produk:

- sistem sudah melampaui tahap lead capture
- customer journey lengkap dari discovery sampai pasca booking sudah dimodelkan
- chat diposisikan sebagai komunikasi kontekstual terhadap appointment, bukan chat bebas

### C. Professional layer

Fitur yang sudah hidup:

- professional access dan account switching
- onboarding lifecycle: `draft`, `ready_for_review`, `submitted`, `changes_requested`, `verified`, `published`
- dashboard requests
- dashboard services
- dashboard availability
- dashboard coverage
- dashboard portfolio
- dashboard trust
- professional notifications
- professional profile

Makna produk:

- supply-side marketplace sudah sangat serius
- profesional tidak hanya menjadi profil yang bisa dilihat, tetapi operator aktif yang mengelola inventory dan permintaan
- publish ke publik diperlakukan sebagai hak yang harus didapat setelah readiness dan review, bukan default

### D. Admin layer

Fitur yang sudah hidup:

- admin login dan session restore
- overview
- customers
- professionals
- services
- appointments
- support desk
- studio untuk operasi snapshot/table

Makna produk:

- ini adalah managed marketplace
- admin bukan akses tambahan, tetapi bagian inti dari desain operasi
- platform siap menangani review, triage, investigasi, dan maintenance data runtime

### E. System layer

Kapabilitas sistem yang mendukung produk:

- backend contract-first
- PostgreSQL untuk mutable state
- public read-model dan bootstrap content
- realtime websocket chat
- typed SDK antara frontend dan backend
- seed dataset kaya untuk QA dan simulasi product states

Makna produk:

- fondasi teknisnya sudah diarahkan untuk operasi marketplace yang serius
- sistem sengaja memisahkan discovery, state transaksional, dan operasi backend agar fitur dapat bertumbuh

## 11. Domain Layanan Yang Tercermin Dari Seed Data

Berdasarkan inventory yang ada saat ini, produk sudah memiliki:

- `11` master service
- `6` kategori layanan
- `3` mode delivery
- `2` tipe booking flow
- `12` fixture appointment lintas lifecycle
- `8` support ticket fixture

Kategori layanan saat ini:

- Newborn
- Postpartum
- Konsultasi
- Stroke
- Pijat Cape
- Sunnah

Contoh layanan yang sudah hidup:

- pijat bayi
- konsultasi laktasi
- pendampingan nifas
- konsultasi tumbuh kembang
- terapi gerak motorik
- bekam
- pijat full body
- cukur rambut bayi
- pijat refleksi rumah
- kelas menyusui online

Analisis dari data ini:

- kategori inti paling kuat tetap ibu, bayi, dan keluarga
- ada ekspansi ke layanan pendamping untuk memperbesar supply dan frekuensi penggunaan
- produk sudah diuji untuk kombinasi layanan informasional, konsultatif, dan tindakan lapangan

## 12. Use Case Utama

### Use case customer

1. Ibu baru mencari konsultasi laktasi online yang bisa dibooking cepat.
2. Keluarga ingin memesan home visit pendampingan nifas di area terdekat.
3. Orang tua membandingkan beberapa profesional untuk layanan pijat bayi atau tumbuh kembang.
4. Customer melacak status request, pembayaran, konfirmasi, dan progres layanan.
5. Customer berkomunikasi dengan profesional di thread yang relevan dengan appointment.
6. Customer membuat support ticket ketika terjadi masalah layanan, pembayaran, atau akun.

### Use case professional

1. Profesional baru mendaftar dan melengkapi onboarding sampai siap diajukan ke admin.
2. Profesional mengaktifkan layanan, memilih mode booking, dan mengatur harga serta durasi.
3. Profesional menentukan jam kerja, minimum notice, dan override hari khusus.
4. Profesional mengatur area coverage dan radius home visit.
5. Profesional meninjau request, menerima, menolak, menjadwalkan, atau menyelesaikan layanan.
6. Profesional memperkuat trust melalui credential, portfolio, gallery, dan activity story.

### Use case admin

1. Admin meninjau profesional yang siap review lalu memverifikasi atau meminta revisi.
2. Admin memantau appointment yang macet di payment, confirmation, atau support escalation.
3. Admin menangani support ticket customer dan profesional.
4. Admin memeriksa kualitas data layanan, kategori, dan penawaran profesional.
5. Admin menggunakan studio untuk operasi data yang lebih langsung saat QA atau troubleshooting.

## 13. Masalah Bisnis Yang Diselesaikan Secara Nyata

Jika dilihat dari seluruh feature set, produk ini berusaha menyelesaikan tiga kelas masalah besar sekaligus:

### A. Discovery problem

Pengguna sering tahu kebutuhannya, tetapi tidak tahu siapa yang tepat, dekat, tersedia, dan tepercaya.

Produk menjawabnya dengan:

- katalog layanan
- filter profesional
- nearby professionals
- detail profil profesional
- trust, portfolio, dan credential

### B. Transaction coordination problem

Masalah terbesar marketplace jasa bukan hanya menemukan tenaga profesional, tetapi memastikan layanan benar-benar bisa dieksekusi.

Produk menjawabnya dengan:

- delivery mode validation
- coverage area validation
- availability rules
- request versus instant booking flow
- appointment lifecycle
- immutable snapshot per order

### C. Service operations problem

Sesudah booking dibuat, risiko utama biasanya ada pada komunikasi, perubahan status, komplain, dan kualitas operasi.

Produk menjawabnya dengan:

- appointment timeline
- notifications
- realtime chat
- support ticket
- admin support desk
- admin operational console

## 14. Analisis Strategis Dari Fitur Yang Ada

### 1. Ini bukan sekadar aplikasi booking

Dari kombinasi onboarding profesional, request board, admin review, support desk, dan studio, sistem ini lebih tepat dibaca sebagai `operating system untuk marketplace jasa`, bukan sekadar aplikasi browsing profesional.

### 2. Trust adalah tema produk yang paling dominan

Banyak fitur mengarah ke trust:

- professional verification lifecycle
- credentials
- portfolio
- gallery
- activity stories
- ratings dan reviews
- published gate

Ini menandakan bahwa pembeda utama produk bukan harga murah, tetapi rasa aman dan kepastian kualitas.

### 3. Operational validity lebih penting daripada listing sebanyak mungkin

Rules untuk availability, coverage, minimum notice, lifecycle publish, dan status appointment menunjukkan bahwa platform lebih mementingkan layanan yang benar-benar bisa dikirim daripada sekadar menambah jumlah listing.

### 4. Halaman profesional adalah pusat monetisasi

Service detail hanya mengarahkan, tetapi professional detail yang menutup transaksi. Ini berarti:

- kualitas halaman profesional adalah kunci conversion
- data services, trust, schedule, dan coverage harus selalu sinkron
- supply quality langsung memengaruhi GMV dan completion rate

### 5. Admin sudah diposisikan sebagai penjaga kualitas marketplace

Adanya support desk, overview, studio, dan module-specific pages menunjukkan model operasi yang kuratif dan aktif. Produk ini belum didesain sebagai marketplace murni self-serve tanpa pengawasan.

### 6. Produk punya potensi menjadi care network, bukan hanya marketplace bidan

Seed data menunjukkan ekspansi ke postpartum, therapy, rehab, wellness, dan sunnah care. Ini membuka peluang perluasan kategori, tetapi juga menuntut kejelasan strategi:

- tetap `bidan-led marketplace`
- atau berkembang ke `localized homecare marketplace`

## 15. KPI Yang Paling Relevan Untuk Produk Ini

Berikut adalah KPI yang paling sesuai dengan fitur yang sudah ada saat ini.

### KPI akuisisi dan demand

- visitor ke registered customer conversion
- browse to professional-detail conversion
- professional-detail to booking conversion
- booking intent by service category

### KPI supply

- jumlah profesional `published`
- waktu rata-rata dari `draft` ke `published`
- persentase profesional yang benar-benar bookable
- rata-rata jumlah layanan aktif per profesional

### KPI transaksi

- request approval rate
- payment completion rate
- confirmed to completed rate
- cancellation rate
- repeat booking rate

### KPI operasi

- median response time profesional
- SLA penyelesaian support ticket
- share appointment yang membutuhkan intervensi admin
- persentase complaint per kategori layanan

## 16. Batasan Produk Yang Terlihat Saat Ini

Beberapa batasan yang terlihat dari implementasi sekarang:

- reschedule formal belum menjadi domain transaksi; pendekatannya masih `cancel lalu buat order baru`
- public read-model masih berada dalam fase transisi menuju struktur yang lebih matang
- support dan review sudah ada, tetapi governance konten dan editorial masih belum terlihat sebagai domain besar terpisah
- pembayaran hadir sebagai lifecycle state, tetapi orchestration payment gateway belum tampak sebagai capability domain yang kaya

Ini bukan kelemahan fatal. Justru ini menunjukkan prioritas saat ini masih benar: validasi model layanan dan operasi marketplace lebih dulu.

## 17. Kesimpulan

Berdasarkan seluruh feature set, yang sedang dibangun adalah `Bidan Marketplace`: sebuah marketplace layanan bidan dan care-at-home yang tidak berhenti di discovery, tetapi mengelola supply readiness, validasi operasional, lifecycle appointment, komunikasi, dan support resolution.

Kekuatan utamanya ada pada tiga hal:

- trust-based supply onboarding
- location and operations-aware booking
- admin-controlled marketplace quality

Jika diarahkan dengan positioning yang jelas, produk ini berpotensi menjadi fondasi marketplace layanan ibu, bayi, keluarga, dan homecare yang jauh lebih kuat daripada sekadar direktori profesional.
