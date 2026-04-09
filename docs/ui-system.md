# UI System

## Tujuan

Dokumen ini menjelaskan design system Bidan yang menjadi sumber reusable UI untuk seluruh surface aktif.

## Current Truth

Visual system V2 memakai Bidan sebagai **master visual language**.

Aturan utamanya:

- `packages/ui` memiliki tokens, primitives, dan patterns
- `packages/web` hanya meng-compose UI tersebut ke dalam page containers
- `apps/bidan` dan `apps/admin` memakai keluarga visual yang sama

## Typography

- Heading: `Figtree`
- Body dan UI: `Noto Sans`

Shared typography di-load dari:

- `packages/ui/src/system.css`
- `packages/web/src/lib/fonts.ts`

## Theme Ownership

Source of truth theme ada di:

- `config/platform-manifest.json`
- `packages/platform-config/src/index.ts`

Admin tetap berada di keluarga visual Bidan, walau bukan platform page biasa.

## UI Layers

Foundations:

- tokens
- CSS variables
- typography
- radius scale
- shadow scale
- semantic states

Primitives:

- buttons
- fields
- pills
- banners
- empty states

Patterns:

- shells
- hero panels
- entity cards
- metric tiles
- sidebar nav
- timeline blocks
- document list
- conversation panel
- form sections

## Ownership Rules

- komponen reusable lintas surface harus masuk ke `packages/ui`
- `packages/web` tidak boleh membuat visual primitive baru
- warna presentational tidak boleh di-hardcode di `packages/web`
- jika recipe visual dipakai ulang dua kali atau lebih, pindahkan ke `packages/ui`

## Tailwind Contract

Setiap app `globals.css` harus punya `@source` ke:

- `packages/ui/src`
- `packages/web/src`

Tanpa ini, app akan kehilangan shared utility classes dari design system.

## Verification

Jalankan:

```bash
npm run ui:guard
```

Manual QA minimum:

- home, explore, services
- login/register/forgot-password
- orders dan order detail
- professional apply
- professional dashboard
- admin overview
