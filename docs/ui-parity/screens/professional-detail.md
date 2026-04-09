# Professional Detail

## Source of truth

- `ProfessionalDetailScreen`
- `ProfessionalHeroSection`
- `CustomerRequestStatusCard`
- `ProfessionalPracticeSections`
- `ProfessionalPortfolioSections`
- `ProfessionalTrustSections`
- `ProfessionalServicesSection`
- `ProfessionalBookingBar`

## Checklist

- hero card besar dengan trust metrics
- request-preparation / request-status card tepat di bawah hero
- section practice/about
- section portfolio/gallery/story
- section trust/credentials/coverage/availability
- section layanan dengan pilihan aktif
- sticky booking bar di bawah

## Current owner

- `packages/web/src/screens/public/professional-detail/view.tsx`

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/ProfessionalDetailScreen.tsx`

## Final acceptance notes

- Contract publik sekarang membawa `profile`, `portfolio`, `gallery`, `coverage`, `availability`, dan `trustMetrics`, sehingga layout lama bisa dipulihkan tanpa placeholder tipis.
- Hero, request-prep, practice, portfolio/gallery/story, trust/coverage, service selection, dan sticky booking bar sudah kembali ke urutan repo lama.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
