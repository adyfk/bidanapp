# Auth And Sessions

## Tujuan

Dokumen ini menjelaskan model auth final untuk Bidan V2, baik dari sisi UX maupun dari sisi session behavior.

## Current Truth

- login UI customer-facing ada di `bidan`
- route account tools utama juga tersedia native di `bidan`
- account viewer tetap satu dan global
- customer dan professional memakai identity yang sama

## Native Auth Routes

Di `bidan`:

- `/{locale}/login`
- `/{locale}/register`
- `/{locale}/forgot-password`
- `/{locale}/security`
- `/{locale}/sessions`

## Session Model

- one shared viewer session family
- cookie viewer berlaku lintas sibling subdomains
- admin auth memakai cookie terpisah

Local cookie model:

- domain `.lvh.me`
- path `/`
- same-site `Lax`

Production cookie model:

- shared parent domain
- secure cookies
- same-site `Lax`
- http-only

## UX Rules

- user bisa login langsung dari `bidan`
- user tidak perlu pindah app hanya untuk masuk atau membuka account tools dasar
- setelah login, state account harus sinkron di semua surface viewer
- logout current session dari salah satu viewer surface akan mengakhiri session viewer yang sama
- `Logout all devices` tetap tersedia dari route account tools yang sama

## Seeded QA

Viewer accounts:

- customer `+628111111001`
- approved professional `+628111111002`
- submitted professional `+628111111003`
- draft professional `+628111111004`

Viewer password:

- `BidanDemo#2026`

## Verification

Gunakan `npm run dev:smoke` untuk memverifikasi:

- login di `bidan`
- route `bidan` `/security` dan `/sessions` membaca session yang sama
- logout current session membersihkan cookie viewer lintas subdomain
