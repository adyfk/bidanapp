# Auth And Access

## Source of truth

- `CustomerAccessScreen`
- onboarding access cards di repo lama

## Current owner

- `packages/web/src/screens/auth/shared/viewer-auth-page.tsx`
- `packages/web/src/screens/auth/shared/parts/*`
- `packages/web/src/screens/auth/shared/viewer-security-page.tsx`
- `packages/web/src/screens/auth/shared/viewer-sessions-page.tsx`

## Legacy section order

- sticky top bar
- gradient access hero
- segmented tabs
- dense muted auth card
- visitor CTA
- professional CTA
- security and device control follow-up

## Checklist

- Sticky top bar putih dan mobile-first
- Hero gradient pendek, bukan marketing explainer panjang
- Tab `Masuk / Daftar` rapat dan tactile
- Input muted pink dengan density lama
- CTA utama jelas, CTA sekunder tidak mendominasi
- Visitor path tetap ada, tetapi tidak mengganggu auth utama
- Professional path tetap terpisah

## Flow checks

- login berhasil kembali ke target path Bidan
- register berhasil kembali ke target path Bidan
- forgot-password memakai OTP flow native Bidan
- security dan sessions tetap native di Bidan

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/CustomerAccessScreen.tsx`
- `bidanapp copy/apps/frontend/src/components/screens/OnboardingScreen.tsx`

## Final acceptance notes

- Copy auth sudah kembali singkat, operasional, dan tidak lagi terasa seperti explainer sistem.
- Visitor path, customer access, dan professional path sekarang kembali terasa seperti satu family visual Bidan lama.
- Security dan device sessions tetap native di Bidan, tetapi recipe-nya sudah satu keluarga dengan access flow.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
