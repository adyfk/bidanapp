# Profile Admin Support Flow

## Objective

Tambahkan pusat bantuan pada halaman profil customer dan professional agar user punya jalur yang jelas untuk:

- komplain layanan
- refund atau koreksi pembayaran
- pelaporan profil/perilaku
- kendala login atau akses akun
- blocker operasional lain yang memang harus ditangani admin

Fokus utama perubahan ini adalah mempersingkat waktu eskalasi. User tidak perlu menebak harus chat siapa, masuk menu mana, atau menunggu dari jalur yang salah.

## Why This Matters

Masalah paling umum di flow marketplace layanan biasanya jatuh ke empat area:

1. Jalur eskalasi tidak jelas.
   User tahu ada masalah, tetapi tidak tahu harus hubungi profesional, CS, atau menunggu sistem.

2. Komplain dan refund bercampur.
   Ticket tanpa kategori membuat admin harus membaca ulang konteks dari nol dan memperpanjang SLA.

3. Tidak ada ekspektasi waktu penanganan.
   Saat user tidak melihat SLA dan status, mereka cenderung repeat contact, spam chat, atau menilai platform lambat.

4. Professional juga butuh jalur admin.
   Bukan hanya customer yang perlu bantuan. Professional butuh mediasi untuk dispute, koreksi pembayaran, pelaporan customer, dan bug dashboard.

## Personas And Use Cases

### Customer

- Komplain kualitas layanan, keterlambatan, atau perubahan jadwal.
- Ajukan refund untuk layanan batal atau pembayaran ganda.
- Laporkan profesional karena perilaku, keamanan, atau detail profil tidak valid.
- Eskalasi kendala login dan reset password.

### Professional

- Eskalasi dispute operasional dengan customer.
- Klarifikasi refund atau koreksi pembayaran.
- Laporkan customer karena perilaku berisiko.
- Laporkan bug dashboard, request board, atau notifikasi.
- Pulihkan akses akun bila login bermasalah.

## UI Placement

### Customer Profile

- Tambahkan `support hub card` setelah quick actions.
- Tambahkan row `Bantuan admin` di dalam settings card.
- Buka `bottom sheet` khusus support saat card atau row ditekan.

### Professional Profile

- Tambahkan `support hub card` setelah quick actions.
- Tambahkan row `Bantuan admin` di dalam settings card.
- Gunakan `bottom sheet` yang sama, tetapi copy dan kategori disesuaikan untuk role professional.

## Support Sheet Structure

Bottom sheet dibagi menjadi empat blok:

1. Overview
   Menjelaskan kapan admin perlu turun tangan dan SLA utama.

2. Ticket Form
   User memilih kategori, kanal follow-up, prioritas, ringkasan, referensi, dan detail masalah.

3. Handling Flow
   Menjelaskan urutan internal: ticket logged, triage, evidence review, resolution.

4. Recent Tickets
   Menampilkan ticket terakhir agar user bisa melihat status terbaru tanpa membuka area lain.

## Category Design

### Customer Categories

- `serviceComplaint`
- `refundRequest`
- `paymentIssue`
- `reportProfessional`
- `accountAccess`
- `other`

### Professional Categories

- `serviceDispute`
- `refundClarification`
- `accountAccess`
- `reportCustomer`
- `technicalIssue`
- `other`

Prinsipnya sederhana: kategori harus cukup spesifik untuk mempercepat triage, tetapi tidak terlalu banyak sampai user bingung.

## Suggested Operational Flow

### Stage 1: Ticket Logged

Data minimum:

- role pelapor
- category
- preferred contact channel
- contact value
- urgency
- summary
- details
- optional reference code

### Stage 2: Triage

Admin menentukan:

- validitas kategori
- severity
- apakah butuh bukti tambahan
- siapa PIC yang menangani

### Stage 3: Evidence Review

Admin cross-check:

- riwayat booking
- status pembayaran
- perubahan jadwal
- chat context
- pelaporan keamanan bila ada

### Stage 4: Resolution

Hasil akhir bisa berupa:

- resolved
- refund approved
- refund rejected with reason
- account restored
- technical issue acknowledged
- escalation to trust/safety

## SLA Recommendation

- first response: `<10 menit`
- evidence review target: `<2 jam`
- resolution target: `<24 jam`
- urgent safety or active-service disruption: `<30 menit`

SLA ini sudah ditampilkan di UI supaya ekspektasi user dan ritme operasional admin selaras.

## Backend/Data Follow-Up

Untuk implementasi backend nanti, satu entitas `support_ticket` sebaiknya minimal punya:

- `id`
- `reporter_role`
- `reporter_user_id`
- `category`
- `status`
- `urgency`
- `preferred_channel`
- `contact_value`
- `summary`
- `details`
- `reference_code`
- `assigned_admin_id`
- `created_at`
- `updated_at`
- `resolved_at`

Opsional tetapi penting:

- `attachments`
- `booking_id`
- `payment_id`
- `resolution_note`
- `refund_decision`
- `trust_safety_flag`

## Success Metrics

Setelah fitur ini live, metrik yang paling masuk akal dipantau:

- time to first response
- time to resolution
- refund turnaround time
- repeat-contact rate per ticket
- ticket volume by category
- unresolved ticket backlog
- escalation rate from active bookings

## Current Frontend Scope

Implementasi saat ini sudah melewati tahap frontend-only awal:

- UI entry point sudah tersedia di profile customer dan professional
- form ticket sudah bisa diisi
- state support desk sekarang dipersist ke backend
- belum ada upload file
- belum ada upload attachment, notif admin async, atau tracking audit yang lebih detail

## Next Recommended Step

Prioritas berikutnya bukan lagi sekadar menyambungkan storage dasar, tetapi memecah snapshot support desk menjadi entitas support ticket yang lebih ter-normalisasi. Begitu ticket punya audit trail granular, attachment, assignment history, dan notification fanout, fitur ini baru benar-benar siap skala operasional.
