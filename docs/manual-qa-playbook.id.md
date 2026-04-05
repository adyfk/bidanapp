# Playbook Manual QA

Dokumen ini adalah entrypoint tercepat untuk menjalankan manual QA yang repeatable pada seeded runtime BidanApp.

Jika operator Anda lebih nyaman dengan dokumen teknis berbahasa Inggris, gunakan pendampingnya: [Manual QA Playbook](./manual-qa-playbook.md).

Gunakan referensi ini saat butuh konteks lebih dalam:

- [Getting Started](./getting-started.md)
- [QA Seed Matrix](./qa-seed-matrix.md)
- [User Flow Pack](./user-flows/README.md)
- [Seed Data Blueprint](./seed-data/README.md)

## 1. Setup Lokal Sekali Saja

Install dependency dan siapkan file env lokal:

```bash
npm install
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

Runtime lokal default:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:8080/api/v1`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## 2. Reset Ke Seed QA Komprehensif

Dari root repo, siapkan runtime yang bersih:

```bash
npm run qa:manual:setup
```

Command ini akan:

- menyalakan PostgreSQL dan Redis via Docker Compose
- menerapkan migrasi Atlas terbaru
- me-reset lalu me-reseed backend dengan skenario `comprehensive`

Setelah itu jalankan app:

```bash
npm run dev
```

Jika hanya perlu satu app:

```bash
npm run dev:backend
npm run dev:frontend
```

Untuk melihat paket QA dalam bentuk machine-readable JSON:

```bash
npm run qa:manual:summary
```

Contoh inspeksi cepat:

```bash
npm --silent run qa:manual:summary | jq '.manualQaCases[] | {id, titleId, startRoutes, sampleEntityRefs}'
```

Gunakan `npm run qa:manual:setup` lagi kapan pun Anda ingin kembali ke baseline yang bersih sebelum menjalankan pass berikutnya.

## 3. URL Lokal

- entry visitor: `http://localhost:3000/id`
- entry visitor English: `http://localhost:3000/en`
- login customer: `http://localhost:3000/id/auth/customer`
- login profesional: `http://localhost:3000/id/for-professionals`
- login admin: `http://localhost:3000/admin/login`
- backend health: `http://localhost:8080/api/v1/health`
- backend docs: `http://localhost:8080/api/v1/docs`

## 4. Cakupan Seeded Runtime

Seed QA komprehensif ini mencakup:

- 17 manual QA case stabil dengan ID `PUB-01` sampai `ADM-04`
- browsing visitor pada entrypoint locale Indonesia dan English
- 3 persona customer dengan cabang aktif, unread, dan history-heavy
- 6 persona profesional dengan state `published`, `submitted`, `changes_requested`, `verified`, `draft`, dan `ready_for_review`
- 4 persona admin untuk area support, reviews, ops, dan catalog
- lifecycle appointment dari `requested` sampai `completed`, termasuk `cancelled`, `rejected`, dan `expired`
- seluruh service delivery mode: `home_visit`, `online`, dan `onsite`
- dua booking flow: `instant` dan `request`

JSON summary sekarang memuat:

- `manualQaCases`
- `sampleEntityRefs`
- `customerScenarios`
- `professionalScenarios`
- `adminScenarios`

## 5. Akun QA Yang Tersedia

### Akun customer

Semua akun customer memakai password `Customer2026A`.

| Persona | Phone | Cocok untuk |
| --- | --- | --- |
| Alya Rahma | `+6281234567890` | lifecycle aktif, sebagian notifikasi sudah terbaca, dan chat appointment seed |
| Nadia Prameswari | `+628119021456` | notifikasi unread dan cabang `requested` |
| Hendra Saputra | `+6287812009087` | journey history dengan status completed dan cancelled |

### Akun profesional

Semua akun profesional memakai password `Professional2026A`.

| Persona | Phone | Review state | Cocok untuk |
| --- | --- | --- | --- |
| Clara Wijaya | `+6281370000001` | `published` | visibilitas publik dan edit dashboard yang persisten |
| Omeya Sen | `+6281370000002` | `submitted` | perilaku read-only saat menunggu review |
| Rani Hartati | `+6281370000003` | `changes_requested` | flow revisi dan resubmission |
| Martha Teria | `+6281370000004` | `verified` | flow approved tapi belum dipublish |
| Alex Ben | `+6281370000005` | `draft` | onboarding yang belum lengkap |
| Dimas Pratama | `+6281370000006` | `ready_for_review` | warning pra-review dan featured service yang belum terpenuhi |

### Akun admin

Gunakan email berikut dengan password yang dikonfigurasi pada `apps/backend/.env` di `ADMIN_CONSOLE_CREDENTIALS_JSON`.

| Persona | Email | Fokus |
| --- | --- | --- |
| Naya Pratama | `naya@ops.bidanapp.id` | support |
| Rani Setiawan | `rani@ops.bidanapp.id` | reviews |
| Dimas Putra | `dimas@ops.bidanapp.id` | ops |
| Vina Lestari | `vina@ops.bidanapp.id` | catalog |

## 6. Paket Case Manual QA

### Case public

| Case | Start routes | Contoh entity dari seed | Yang perlu divalidasi |
| --- | --- | --- | --- |
| `PUB-01` perpindahan bahasa dan entry onboarding | `/id`, `/en` | `runtime-default`, `jakarta-selatan-cilandak` | onboarding tampil bersih, perpindahan locale stabil, dan context visitor seed tetap deterministik |
| `PUB-02` surface discovery publik | `/id/home`, `/id/explore`, `/id/services` | service `s5 / konsultasi-laktasi`, profesional `6 / clara-wijaya` | section katalog ter-hydrate, kartu discovery konsisten, dan state trust atau CTA tetap koheren |
| `PUB-03` detail profesional published | `/id/p/clara-wijaya` | profesional `6 / clara-wijaya`, service `s5 / konsultasi-laktasi` | trust publik, daftar layanan, dan entry booking terlihat siap produksi |
| `PUB-04` routing discovery dari halaman layanan | `/id/s/konsultasi-laktasi` | service `s5 / konsultasi-laktasi`, profesional `6 / clara-wijaya` | detail layanan terbuka dengan bersih dan lanjut ke flow profesional yang kompatibel |

### Case customer

| Case | Persona | Start routes | Contoh entity dari seed | Yang perlu divalidasi |
| --- | --- | --- | --- | --- |
| `CUS-01` lifecycle aktif dan chat seed | Alya Rahma | `/id/auth/customer`, `/id/profile`, `/id/notifications`, `/id/appointments` | appointment `apt-005`, `apt-004`, chat thread `thread-apt-005` | session dan profil langsung hydrate, notifikasi yang sebagian terbaca tetap masuk akal, dan history chat seed muncul sebelum kirim pesan baru |
| `CUS-02` notifikasi unread dan state requested | Nadia Prameswari | `/id/auth/customer`, `/id/notifications`, `/id/appointments` | appointment `seed-qa-ibu-nadia-requested` | badge unread tetap terlihat, kartu requested sesuai backend state, dan edit profil tetap tersimpan setelah refresh |
| `CUS-03` riwayat dan journey yang sudah selesai | Hendra Saputra | `/id/auth/customer`, `/id/appointments`, `/id/services`, `/id/p/clara-wijaya` | appointment `seed-qa-mr-hendra-completed`, `seed-qa-mr-hendra-cancelled`, profesional `clara-wijaya` | timeline completed atau cancelled tetap koheren, surface history stabil, dan favorit atau lokasi bertahan saat berpindah halaman |

### Case profesional

| Case | Persona | Start routes | Contoh entity dari seed | Yang perlu divalidasi |
| --- | --- | --- | --- | --- |
| `PRO-01` portal profesional published | Clara Wijaya | `/id/for-professionals`, `/id/for-professionals/dashboard/requests`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/coverage`, `/id/for-professionals/dashboard/trust` | profesional `6 / clara-wijaya`, service `s5 / konsultasi-laktasi` | portal hydrate dari backend state, edit tetap tersimpan, dan profil publik merefleksikan state published |
| `PRO-02` gate review submitted | Omeya Sen | `/id/for-professionals`, `/id/for-professionals/dashboard/overview` | profesional `1 / omeya-sen`, service `s1 / pijat-bayi` | state submitted terlihat jelas dan aksi yang seharusnya tergating memang tetap terkunci |
| `PRO-03` flow revisi changes requested | Rani Hartati | `/id/for-professionals`, `/id/for-professionals/dashboard/portfolio`, `/id/for-professionals/dashboard/coverage` | profesional `4 / rani-hartati`, service `s7 / pendampingan-nifas` | feedback admin terlihat, data bisa direvisi, dan resubmission tetap koheren |
| `PRO-04` state verified sebelum publish | Martha Teria | `/id/for-professionals`, `/id/for-professionals/dashboard/trust` | profesional `3 / martha-teria`, service `s6 / terapi-gerak-stroke` | outcome verified terlihat dan profil siap untuk publish final |
| `PRO-05` gap onboarding draft | Alex Ben | `/id/for-professionals`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/coverage` | profesional `2 / alex-ben` | layanan kosong, coverage kosong, dan prompt onboarding tetap terlihat |
| `PRO-06` jalur warning ready for review | Dimas Pratama | `/id/for-professionals`, `/id/for-professionals/dashboard/services`, `/id/for-professionals/dashboard/overview` | profesional `5 / dimas-pratama`, service `s3 / pijat-full-body` | layanan sudah ada, syarat featured service belum terpenuhi, dan warning path tetap jelas |

### Case admin

| Case | Persona | Start routes | Contoh entity dari seed | Yang perlu divalidasi |
| --- | --- | --- | --- | --- |
| `ADM-01` triage support desk | Naya Pratama | `/admin/login`, `/admin/support` | tiket `ADM-CUS-1056`, `ADM-CUS-1048`, `ADM-CUS-1036` | tiket urgent, high, dan normal tampil bersamaan dengan command-center seed |
| `ADM-02` operasi review profesional | Rani Setiawan | `/admin/login`, `/admin/professionals` | profesional `1 / omeya-sen`, `4 / rani-hartati`, tiket `ADM-CUS-1036` | screen review profesional ter-hydrate dari backend state dan tetap stabil setelah refresh |
| `ADM-03` konteks booking operasional | Dimas Putra | `/admin/login`, `/admin/customers`, `/admin/appointments` | tiket `ADM-CUS-1048`, appointment `apt-007` | modul customer dan appointment tetap selaras dengan state operasional seed |
| `ADM-04` edit katalog dan studio | Vina Lestari | `/admin/login`, `/admin/services`, `/admin/studio` | service `s5 / konsultasi-laktasi`, tiket `ADM-PRO-2069`, profesional `6 / clara-wijaya` | table hydration berasal dari backend state dan edit aman level baris tetap persisten |

## 7. Urutan QA Yang Direkomendasikan

Gunakan urutan ini untuk pass regresi yang fokus:

1. Reset dengan `npm run qa:manual:setup`.
2. Jalankan app dengan `npm run dev`.
3. Kerjakan `PUB-01` sampai `PUB-04`.
4. Kerjakan `CUS-01` sampai `CUS-03`.
5. Kerjakan `PRO-01` sampai `PRO-06`.
6. Kerjakan `ADM-01` sampai `ADM-04`.
7. Jika runtime menjadi tidak jelas setelah mutasi, seed ulang dan ulangi hanya pack yang terdampak.

## 8. Backstop Otomatis Opsional

Jalankan smoke pack di atas seed yang sama:

```bash
npm run qa:manual:smoke
```

Jalankan browser E2E pada dataset yang sama:

```bash
npm run mcp:playwright:install
PLAYWRIGHT_BACKEND_MODE=seeded npm run test:e2e:frontend
```

## 9. Sumber Kebenaran

Gunakan playbook ini sebagai panduan operasional singkat.

Saat butuh detail lebih dalam, gunakan:

- [QA Seed Matrix](./qa-seed-matrix.md) untuk peta skenario, count, dan contoh CLI yang lebih lengkap
- [User Flow Pack](./user-flows/README.md) untuk perilaku produk per layar
- [Seed Data Blueprint](./seed-data/README.md) untuk model seed ternormalisasi yang mendasari seluruh skenario ini
