# Document Storage

## Tujuan

Dokumen ini menjelaskan alur upload, penyimpanan, dan akses dokumen professional pada Bidan V2.

## Current Truth

Dokumen onboarding professional disimpan sebagai:

- file blob nyata di disk lokal
- metadata relasional di `professional_documents`

## Upload Flow

1. Viewer membuka `/{locale}/professionals/apply`
2. Frontend meminta `POST /platforms/{platform_id}/professionals/me/documents/upload-token`
3. Backend membuat row `professional_documents`
4. Frontend meng-upload blob ke endpoint upload yang diberikan
5. `documentId` disimpan ke form onboarding
6. Saat submit onboarding, dokumen itu di-link ke application/profile
7. Admin membuka dokumen dari review queue lewat guarded download path

## Storage Root

- root diatur oleh `ASSET_STORAGE_DIR`
- fallback lokal: `apps/backend/storage`
- seeded demo files juga disalin ke root ini saat `dev:setup` atau `dev:seed:bidan`

## Download Access

Download path:

- `GET /api/v1/professional-documents/{document_id}`

Akses download digate oleh backend berdasarkan viewer/admin session yang valid.

## Demo Seed Notes

Seed demo menyiapkan dokumen nyata untuk:

- approved professional
- submitted professional
- draft professional

Ini membuat admin review dan apply flow bisa diuji tanpa fake URLs.

## Current Scope

- local-first disk storage
- relational metadata di Postgres
- adapter-friendly untuk future object storage
