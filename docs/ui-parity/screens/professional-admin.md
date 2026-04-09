# Professional And Admin

## Source of truth

- `ProfessionalAccessScreen`
- `ProfessionalDashboardShell` family
- `ProfessionalProfileScreen`
- `AdminLoginScreen`
- `AdminConsoleShell`
- `AdminModuleScreens`

## Checklist

- apply/professional access mengikuti tone lama, bukan portal utilitas generik
- workspace sections memakai hierarchy lama yang padat
- workspace profile mengikuti identity/settings/support flow lama
- admin login singkat dan operasional
- admin console modules terasa satu family dengan produk lama

## Flow checks

- apply -> review state -> approved workspace
- approved workspace -> profile section -> edit profile/public preview
- admin login -> overview
- admin review queue -> support/refund/payout flow

## Current status

- `professional apply`: `matched`
- `professional workspace shell`: `matched`
- `professional workspace profile`: `matched`
- `admin login`: `matched`
- `admin console`: `matched`

## Notes

- `ProfessionalProfileScreen` lama sekarang dipetakan ke `/{locale}/professionals/dashboard/profile`, bukan route baru.
- `ChatScreen` lama tidak dihidupkan kembali sebagai route baru; parity-nya sudah mulai diserap ke `/{locale}/orders/[orderId]`.
