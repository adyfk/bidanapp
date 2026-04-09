# Review Guide

Dokumen ini membantu founder, PM, operator, atau engineer membaca visual proof terbaru tanpa harus membuka source code.

## Cara buka hasil terbaru

1. Jalankan `npm run e2e:journey`.
2. Jalankan `npm run journey:open`.
3. Buka report di:
   [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)

## Cara membaca report

Urutan baca yang disarankan:

1. pilih test journey yang ingin ditinjau
2. baca nama use case dan step titles
3. buka screenshot per step
4. putar video journey bila ingin melihat alur penuh
5. buka trace hanya jika ada perilaku yang terasa aneh

## Apa yang harus cocok

- nama step sesuai aksi user yang benar-benar terjadi
- screenshot sesuai expected state
- video tidak menunjukkan redirect atau error aneh
- route yang dibuka sesuai handbook
- guard state tampil jelas saat akun belum memenuhi syarat

## Kapan buka trace

Buka trace jika:

- UI terlihat benar tetapi assertion gagal
- klik terasa tidak berefek
- ada state yang meloncat
- ada request API yang tampak gagal

## Artefak raw yang berguna

- manifest per use case:
  [`artifacts/journeys/latest`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest)
- golden reference:
  [`docs/journeys/golden`](/Users/adi/Code/startup/bidanapp/docs/journeys/golden)

## Rule of review

Flow belum dianggap normal penuh jika salah satu dari ini tidak tersedia:

- screenshot step-level
- video journey
- trace
- handbook use case
