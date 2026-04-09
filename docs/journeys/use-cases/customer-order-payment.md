# Customer Order And Payment

## Tujuan

Membuktikan bahwa customer bisa membuat order, menyimulasikan pembayaran, membuka detail order, memulai chat order, dan membuat tiket support dari context order.

## Seed actor

- Customer demo: `+628111111001`

## Preconditions

- seeded offerings tersedia
- simulasi pembayaran lokal tersedia

## Step summary

1. Buka halaman orders.
2. Buat quick order.
3. Simulasikan pembayaran.
4. Buka detail order.
5. Mulai chat order.
6. Buat tiket support dari detail order.

## Review links

- Latest report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Raw manifest: [`artifacts/journeys/latest/customer-order-payment/journey.json`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest/customer-order-payment/journey.json)

## Known assertions

- payment session siap
- payment manual settle berhasil
- detail order bisa dibuka
- chat order-linked berfungsi
- tiket support dari detail order berhasil dibuat
