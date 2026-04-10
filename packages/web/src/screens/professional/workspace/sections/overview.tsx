'use client';

import type { ProfessionalWorkspaceSnapshot } from '@marketplace/marketplace-core';
import { DocumentList } from '@marketplace/ui/patterns';
import { EmptyState } from '@marketplace/ui/primitives';
import { Bell, Compass, Layers3, MapPin, Star, UserRound, Wallet } from 'lucide-react';
import { getApiOrigin } from '../../../../lib/env';
import { createLocalizedPath } from '../../../../lib/platform';
import { WorkspaceActionButton } from '../parts/action-button';
import { WorkspaceMetricCard } from '../parts/metric-card';
import { WorkspaceSurfaceCard } from '../parts/surface-card';

export function OverviewSection({ locale, snapshot }: { locale: string; snapshot: ProfessionalWorkspaceSnapshot }) {
  return (
    <>
      <WorkspaceSurfaceCard
        title="Ringkasan profil"
        description="Lihat cepat apa yang sudah siap sebelum profil Anda tampil ke pelanggan."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <WorkspaceMetricCard
            icon={<UserRound className="h-4 w-4" />}
            label="Nama tampil"
            value={snapshot.profile?.displayName || '-'}
          />
          <WorkspaceMetricCard
            icon={<MapPin className="h-4 w-4" />}
            label="Kota"
            value={snapshot.profile?.city || '-'}
          />
          <WorkspaceMetricCard
            icon={<Star className="h-4 w-4" />}
            label="Review"
            value={snapshot.profile?.reviewStatus || 'draft'}
          />
          <WorkspaceMetricCard
            icon={<Wallet className="h-4 w-4" />}
            label="Application"
            value={snapshot.application?.status || 'draft'}
          />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium text-slate-500">Layanan</p>
            <p className="mt-2 text-[15px] font-bold text-slate-900">{(snapshot.offerings ?? []).length}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium text-slate-500">Order terbaru</p>
            <p className="mt-2 text-[15px] font-bold text-slate-900">{(snapshot.recentOrders ?? []).length}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium text-slate-500">Jangkauan</p>
            <p className="mt-2 text-[15px] font-bold text-slate-900">{(snapshot.coverageAreas ?? []).length}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium text-slate-500">Galeri</p>
            <p className="mt-2 text-[15px] font-bold text-slate-900">{(snapshot.galleryAssets ?? []).length}</p>
          </div>
        </div>
      </WorkspaceSurfaceCard>

      <WorkspaceSurfaceCard
        title="Dokumen aplikasi"
        description="Semua lampiran onboarding Anda ditampilkan di sini agar mudah dicek lagi."
      >
        {snapshot.application?.documents?.length ? (
          <DocumentList
            items={snapshot.application.documents.map((document) => ({
              href: new URL(document.documentUrl, getApiOrigin()).toString(),
              id: document.id,
              label: document.documentKey,
              meta: document.fileName || document.documentUrl,
            }))}
          />
        ) : (
          <EmptyState
            title="Belum ada dokumen"
            description="Lengkapi onboarding untuk mengisi dokumen review profesional."
          />
        )}
      </WorkspaceSurfaceCard>

      <WorkspaceSurfaceCard
        title="Jalur cepat"
        description="Buka halaman yang paling sering Anda pakai tanpa pindah-pindah jauh."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <WorkspaceActionButton
            href={createLocalizedPath(locale, '/orders')}
            icon={<Layers3 className="h-4 w-4" />}
            title="Lihat order customer"
            variant="secondary"
          />
          <WorkspaceActionButton
            href={createLocalizedPath(locale, '/notifications')}
            icon={<Bell className="h-4 w-4" />}
            title="Notifikasi"
            variant="secondary"
          />
          <WorkspaceActionButton
            href={createLocalizedPath(locale, '/support')}
            icon={<Compass className="h-4 w-4" />}
            title="Support"
            variant="secondary"
          />
        </div>
      </WorkspaceSurfaceCard>
    </>
  );
}
