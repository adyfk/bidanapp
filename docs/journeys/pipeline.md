# Journey Pipeline

Dokumen ini menjelaskan alur resmi dari seed sampai visual proof berbasis **Playwright report**.

## 1. Seed and readiness

```bash
npm run dev:setup
npm run dev:smoke
```

Tahap ini memastikan:

- `.env` sinkron
- infra lokal aktif
- migrasi up to date
- seed demo Bidan siap
- readiness route dan seeded state tetap sehat

## 2. Functional E2E gate

```bash
npm run e2e:smoke
```

Tahap ini menjaga flow kritis tetap aman sebelum journey penuh dijalankan.

## 3. Journey capture

```bash
npm run e2e:journey
```

Mode ini akan:

- menyalakan `JOURNEY_MODE`
- menyalakan video default untuk semua journey
- menyalakan trace Playwright
- menyimpan screenshot per step
- menulis manifest stabil per use case ke `artifacts/journeys/latest/<use-case>/journey.json`
- membangun Playwright HTML report ke `artifacts/playwright-report/latest/`

## 4. Open and review

```bash
npm run journey:open
```

Surface utama review:

- [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- [`artifacts/journeys/latest`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest)

## 5. Cleaning artifacts

```bash
npm run journey:clean
```

## Kapan flow dianggap normal

Flow dianggap normal bila:

- precondition di handbook terpenuhi
- report latest menampilkan step yang runtut
- setiap step punya screenshot yang cocok dengan hasil aksi
- video berjalan dan sesuai dengan cerita step
- trace tersedia jika perlu pembuktian debug lebih dalam

## Kapan flow perlu diperbaiki

Flow perlu diperbaiki bila:

- step title dan hasil layar tidak cocok
- screenshot terlihat rusak atau state-nya tidak masuk akal
- video menunjukkan redirect aneh atau aksi macet
- trace memperlihatkan request gagal
- handbook dan report memberi cerita yang bertentangan
