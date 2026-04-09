# Local Runtime Troubleshooting

## Tujuan

Dokumen ini membantu mendiagnosis masalah lokal yang paling umum saat menjalankan workspace Bidan.

## Port Map

- backend: `8080`
- bidan: `3002`
- admin: `3005`

Jika salah satu port dipakai proses lain, `npm run dev` akan fail fast.

## First Diagnostic Command

```bash
npm run dev:doctor
```

Command ini memeriksa:

- toolchain
- env files
- PostgreSQL dan Redis reachability
- migration status
- port conflicts

## Common Fixes

Env drift:

- jalankan `npm run env:sync`
- lalu ulang `npm run dev:doctor`

Schema drift:

- jalankan `npm run dev:db:reset`

Demo data hilang atau berubah:

- jalankan `npm run dev:seed:bidan`

Smoke failure:

- jalankan `npm run dev:smoke`
- baca check yang gagal
- cocokkan dengan seeded credentials dan routes di handbook

## Local Domain Rules

Gunakan:

- `bidan.lvh.me`
- `admin.lvh.me`
- `api.lvh.me`

Jangan gunakan `localhost` untuk menguji shared auth behavior lintas subdomain.

## Infra

Jika database atau Redis belum hidup:

```bash
npm run infra:up
```

Jika butuh dimatikan:

```bash
npm run infra:down
```

## Verification Commands

Setelah perbaikan:

```bash
npm run dev:smoke
npm run boundary:check
npm run typecheck
```
