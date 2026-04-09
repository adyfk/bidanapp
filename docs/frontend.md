# Frontend

## Tujuan

Dokumen ini menjelaskan ownership frontend, route shape, dan aturan shared UI untuk Bidan V2.

## Current Truth

Frontend aktif terdiri dari:

- `apps/bidan`
- `apps/admin`

Shared logic berada di:

- `packages/marketplace-core`
- `packages/platform-config`
- `packages/sdk`
- `packages/ui`
- `packages/web`

## Ownership Rules

- `apps/*` harus tetap tipis
- `packages/web` memiliki generic marketplace screen graph, route composition, route adapters, dan server helpers
- `packages/marketplace-core` memiliki reusable business logic, view-model mapping, dan orchestration helpers
- `packages/ui` memiliki generic marketplace visual foundations, motion primitives, dan reusable patterns
- `packages/platform-config` memiliki manifest theme preset, motion preset, locale, SEO, nav/copy pack, dan registration schema
- `packages/sdk` memiliki generated client dan typed adapters

## Bidan Visual Contract

- Bidan adalah canonical visual language
- `packages/ui` adalah owner seluruh visual recipes reusable
- preset visual Bidan diambil dari repo copy lama, lalu dipetakan ke generic marketplace primitives
- motion resmi memakai `framer-motion` lewat `packages/ui`
- `packages/web` tidak boleh membuat primitive visual baru
- `packages/web` tidak boleh hardcode presentational colors
- semua app `globals.css` harus mendeklarasikan Tailwind `@source` ke shared packages

## Route Ownership

`packages/web` mengemas:

- landing dan public directory pages
- customer pages
- professional apply flow
- professional dashboard sections
- native auth dan account pages
- admin console pages

`apps/bidan` hanya bind route shell, locale context, dan metadata.

`packages/web/src/screens` adalah owner screen aktif per surface:

- `public`
- `auth`
- `customer`
- `professional`
- `admin`

Setiap vertical baru harus memakai graph yang sama dan hanya mengubah preset/copy/schema dari config.

## Vertical Scaffolding

Untuk membuat vertical baru yang tetap tipis:

```bash
npm run platform:scaffold -- therapist 3011
```

Command ini membuat:

- shell app Next tipis di `apps/<vertical>`
- wrapper routes yang import adapter dari `@marketplace/web`
- stub config di `config/platform-stubs/<vertical>.json`

Setelah itu cukup sambungkan manifest, domain, copy, theme preset, dan professional attribute schema.

## Auth UX Contract

- `bidan` memiliki halaman:
  - `/{locale}/login`
  - `/{locale}/register`
  - `/{locale}/forgot-password`
- `/{locale}/security`
- `/{locale}/sessions`
- form auth di `bidan` memakai shared components reusable dari `@marketplace/web`
- header/account state harus membaca shared viewer session

## Daily Frontend Checks

Gunakan command ini sebelum merge:

```bash
npm run ui:guard
npm run typecheck
npm run build
npm run e2e:smoke
```

Untuk visual QA manual, fokus pada:

- `bidan` home, explore, services, professional detail, offering detail
- auth routes di `bidan`
- professional apply dan dashboard
- admin overview dan queue pages
