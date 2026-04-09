# Marketplace Concept

## Tujuan

Dokumen ini menjelaskan bentuk marketplace yang sedang dibangun, supaya keputusan product, UI, seed, QA, dan vertical reuse tetap selaras dari awal.

## Bentuk Produk

BidanApp adalah marketplace layanan kesehatan terkurasi dengan empat aktor utama:

- visitor untuk browse profesional dan layanan
- customer untuk order, chat, pembayaran, notifikasi, dan support
- professional untuk apply, publish offering, dan mengelola workspace
- admin untuk review, support, refund, payout, dan studio ops

## Surface Yang Dipakai User

Surface utama yang dipakai sehari-hari:

- `bidan` untuk visitor, customer, dan professional
- `admin` untuk tim operasi

Surface utility:

- `auth` untuk tools akun seperti session list, password recovery, dan security tools bila perlu

Aturan UX yang dikunci:

- login harus terasa native di app yang sedang dipakai user
- customer tidak perlu dilempar ke app lain hanya untuk masuk
- security dan session tools boleh dimount lokal di app utama
- `auth` bukan destinasi utama product

## Flow Marketplace

Alur customer:

1. Visitor membuka onboarding atau home.
2. Visitor browse explore, services, professional detail, atau service detail.
3. User login atau daftar langsung di app yang sedang dibuka.
4. Customer membuat order dari offering yang dipilih.
5. Customer menyelesaikan pembayaran.
6. Customer memantau order, chat, notifikasi, dan support dari Bidan.

Alur professional:

1. User masuk dengan akun viewer yang sama.
2. User membuka apply flow profesional.
3. Admin meninjau dokumen dan status aplikasi.
4. Setelah approved, professional mengelola workspace, offering, availability, coverage, dan profile.

Alur admin:

1. Admin login ke console.
2. Admin meninjau professional queue, orders, support, refunds, payouts, dan studio.
3. Semua desk memakai data backend yang sama.

## Model Akun

- viewer account tetap satu per orang
- login customer/professional tetap native di app yang sedang dipakai
- session viewer tetap satu family cookie lintas sibling subdomain
- admin memakai session terpisah

Artinya:

- satu akun viewer bisa menjadi customer lalu lanjut apply profesional
- app baru nanti tetap bisa login native tanpa membuat sistem akun baru
- account tools bisa direuse ke vertical lain tanpa mengubah model auth backend

## Kontrak Domain

Entity utama yang membentuk marketplace:

- directory untuk daftar profesional dan offering publik
- offerings untuk item layanan yang bisa dijual
- orders untuk transaksi utama customer
- payments untuk status pembayaran
- chat untuk percakapan pre-order dan order-linked
- support untuk ticket operasional
- professional onboarding untuk apply dan review
- admin ops untuk refund, payout, dan queue review

## Kontrak Reuse Untuk Vertical Baru

Vertical baru seperti `therapist` atau `homecare` harus tetap memakai template yang sama:

- screen graph dari `@marketplace/web`
- UI dari `@marketplace/ui`
- business logic dari `@marketplace/marketplace-core`

Yang berbeda per vertical hanya:

- manifest
- theme
- copy
- feature flags
- professional attribute schema
- domain dan SEO

## Seed, QA, Dan Proof

Source of truth operasional:

1. `npm run dev:setup`
2. `npm run dev:smoke`
3. `npm run e2e:smoke`
4. `npm run e2e:journey`
5. `npm run journey:open`

Artinya flow dianggap siap bila:

- seed lokal menyediakan data yang masuk akal
- smoke membuktikan runtime siap
- E2E membuktikan behavior utama
- journey proof memperlihatkan screenshot, video, dan trace per langkah
