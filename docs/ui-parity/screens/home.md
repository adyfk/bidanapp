# Home

## Source of truth

- `HomeScreen`

## Section checklist

- sticky header dengan avatar, lokasi, dan shortcut notifikasi
- search bar putih sebagai entry utama
- block aktivitas utama tepat di atas fold
- carousel layanan populer
- row kategori / quick browse
- list profesional tepercaya
- quick help card di bawah feed utama

## Flow checklist

- visitor melihat CTA `Masuk / daftar` dan jalur profesional
- customer melihat aktivitas aktif dari akun yang sama
- home -> services
- home -> explore
- home -> notifications
- home -> orders

## Asset and source references

- `bidanapp copy/apps/frontend/src/components/screens/HomeScreen.tsx`

## Final acceptance notes

- Header avatar, lokasi, search bar, activity block, category row, profesional feed, dan help card sudah kembali ke hierarchy lama.
- Presentation data dari platform config sekarang menjadi source tetap untuk curated sections sehingga feed tidak lagi terasa heuristik.

## Final status

- `layout`: `matched`
- `recipes`: `matched`
- `sections`: `matched`
- `flow`: `matched`
