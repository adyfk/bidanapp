# Explore, Services, And Service Detail

## Source of truth

- `ExploreScreen`
- `ServicesScreen`
- `ServiceDetailScreen`

## Section checklist

- sticky header dan search rhythm
- filter chip / segmented recipes
- card layanan dan professional relation
- hierarchy antara list, detail, dan CTA bawah
- detail provider block dan related services

## Flow checklist

- explore -> professional detail
- services -> service detail
- service detail -> professional detail
- service detail -> orders

## Current owner

- `packages/web/src/screens/public/explore/view.tsx`
- `packages/web/src/screens/public/services/view.tsx`
- `packages/web/src/screens/public/service-detail/view.tsx`

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/ExploreScreen.tsx`
- `bidanapp copy/apps/frontend/src/components/screens/ServicesScreen.tsx`
- `bidanapp copy/apps/frontend/src/components/screens/ServiceDetailScreen.tsx`

## Final acceptance notes

- Explore kembali ke rhythm search, chip, dan area filter lama.
- Services kembali ke category-first browsing dengan kartu layanan yang terasa seperti katalog lama.
- Service detail sekarang kembali punya hero, ringkasan, blok profesional, related services, dan CTA bawah yang mengikuti flow lama.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
