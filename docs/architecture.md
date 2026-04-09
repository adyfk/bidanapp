# Architecture

## Tujuan

Dokumen ini menjelaskan bentuk sistem yang berjalan sekarang untuk Bidan V2.

## Runtime Shape

```text
bidan.xxx.id  -> apps/bidan
admin.xxx.id  -> apps/admin
api.xxx.id    -> apps/backend
```

Shared packages:

- `packages/marketplace-core`
- `packages/platform-config`
- `packages/sdk`
- `packages/ui`
- `packages/web`

Verification and journey layer:

- `tests/e2e` = seeded browser verification
- `artifacts/journeys/latest` = raw visual proof latest-only
- `artifacts/playwright-report/latest` = Playwright HTML report resmi untuk review flow

Current package model:

- `packages/ui` = generic marketplace design system, motion primitives, and reusable visual presets
- `packages/marketplace-core` = reusable business logic, domain view-model mapping, and app-state contracts
- `packages/web` = generic marketplace screen graph, route adapters, server helpers, and route-level composition
- `bidan` = canonical preset pertama yang mengikuti repo lama secara visual

## Current Truth

- frontend aktif memakai multi-app setup
- backend aktif memakai one Go modular monolith
- database aktif memakai one shared PostgreSQL
- viewer account tetap satu per user dan session viewer tetap satu family lintas sibling subdomain
- login dan account entry harus native di app yang sedang dipakai user
- customer profile bersifat global per user
- professional profile dan application tetap platform-scoped lewat `platform_id + user_id`
- commerce memakai `offerings` dan `orders` sebagai pusat domain

## Core Data Model

Global identity:

- `auth_users`
- `auth_identities`
- `auth_sessions`
- `customer_profiles`

Platform registry:

- `platforms`
- `platform_domains`
- `professional_attribute_schemas`

Professional domain:

- `professional_platform_profiles`
- `professional_applications`
- `professional_documents`
- workspace extension tables

Commerce and ops:

- `offerings`
- `orders`
- `order_events`
- `payments`
- `refunds`
- `payouts`
- `chat_threads`
- `support_tickets`

## Architectural Rules

- one shared backend core, bukan backend per app
- one shared database, bukan database per professional
- login UI native di app yang sedang dipakai user
- authorization selalu platform-aware
- `platform_id` wajib ada di tabel yang peka terhadap konteks platform
- theme, SEO, locale, dan registration schema berasal dari platform manifest

## Bidan-Only Scope

Walau fondasinya reusable, runtime aktif saat ini hanya `bidan`.

Artinya:

- manifest aktif hanya mengekspos `bidan`
- demo seed hanya menyiapkan dataset Bidan
- docs dan ops fokus ke satu product surface ini

## Shared Package Responsibilities

- `packages/platform-config`
  source of truth theme preset, motion preset, locale, SEO, copy, nav, dan schema
- `packages/ui`
  generic marketplace design system, motion primitives, tokens, dan patterns
- `packages/marketplace-core`
  reusable controllers, orchestration helpers, and mapping dari entity V2 ke UI view model
- `packages/web`
  generic marketplace screens, layout helpers, route adapters, server helpers, dan thin composition layer
- `packages/sdk`
  generated client dan typed adapters untuk frontend
- `tests/e2e/journey`
  canonical use-case capture yang menghasilkan screenshot manifest dan trace-ready artifacts

## Boundary Contract

- `apps/*` hanya boleh import public entrypoint dari packages
- `apps/*` tidak boleh import `@marketplace/sdk` langsung
- `packages/ui` tidak boleh import `@marketplace/sdk`, `@marketplace/marketplace-core`, atau `@marketplace/web`
- `packages/web` tidak boleh memiliki design tokens dan tidak boleh import internal path package lain
- `packages/marketplace-core` menjadi satu jalur reusable untuk business logic lintas vertical
