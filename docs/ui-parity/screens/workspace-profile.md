# Professional Workspace Profile

## Source of truth

- `ProfessionalProfileScreen`

## Current owner

- `packages/web/src/screens/professional/workspace/sections/profile.tsx`

## Legacy section order

- identity card
- quick action cards
- support entry
- settings rows
- edit/profile sheet flow

## Checklist

- profile section tidak lagi terasa seperti form utilitarian
- quick actions menuju dashboard dan profil publik
- support entry hadir sebagai kartu bantuan, bukan panel JSON
- edit profil dibuka via sheet

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/ProfessionalProfileScreen.tsx`

## Final acceptance notes

- `ProfessionalProfileScreen` lama sekarang resmi dipetakan ke route dashboard profile, bukan route baru.
- Identity card, quick actions, settings rows, support entry, dan edit flow sekarang menjadi owner utama section profile profesional.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
