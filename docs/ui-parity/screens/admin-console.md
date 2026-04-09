# Admin Console

## Source of truth

- `AdminConsoleShell`
- `AdminModuleScreens`

## Current owner

- `packages/web/src/screens/admin/view.tsx`
- `packages/web/src/screens/admin/sections/*`

## Legacy section order

- sidebar
- overview
- customers
- professionals
- orders
- support
- refunds
- payouts
- studio

## Recipe checklist

- stat cards dan queue cards satu family
- filter/action cards terasa operasional
- module layout konsisten

## Flow checklist

- overview -> professionals
- overview -> support/refund/payout
- route coverage semua module admin aktif

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/admin/AdminConsoleShell.tsx`
- `bidanapp copy/docs/user-flows/admin.md`

## Final acceptance notes

- Seluruh module admin aktif sekarang kembali ke hierarchy operator lama dan tetap memakai boundary generic package yang sudah terkunci.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
