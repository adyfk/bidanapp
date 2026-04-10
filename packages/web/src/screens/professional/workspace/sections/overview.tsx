'use client';

import type { ProfessionalWorkspaceSnapshot } from '@marketplace/marketplace-core';
import { DocumentList } from '@marketplace/ui/patterns';
import { EmptyState } from '@marketplace/ui/primitives';
import { Bell, Compass, Layers3, MapPin, Sparkles, Star, UserRound, Wallet } from 'lucide-react';
import { getApiOrigin } from '../../../../lib/env';
import { createLocalizedPath } from '../../../../lib/platform';
import { WorkspaceActionButton } from '../parts/action-button';
import { WorkspaceMetricCard } from '../parts/metric-card';
import { WorkspaceSurfaceCard } from '../parts/surface-card';

export function OverviewSection({ locale, snapshot }: { locale: string; snapshot: ProfessionalWorkspaceSnapshot }) {
  const pendingAreas = [
    !snapshot.profile?.displayName ? 'Nama profil publik' : null,
    !snapshot.profile?.city ? 'Kota praktik' : null,
    !(snapshot.application?.documents ?? []).length ? 'Lampiran dokumen' : null,
    !(snapshot.offerings ?? []).length ? 'Layanan aktif' : null,
    !(snapshot.coverageAreas ?? []).length ? 'Area jangkauan' : null,
    !(snapshot.availabilityRules ?? []).length ? 'Jadwal praktik' : null,
  ].filter(Boolean);

  return (
    <>
      <WorkspaceSurfaceCard
        title="Kontrol kesiapan"
        description="Fold pertama ini merangkum apa yang sudah siap, apa yang masih kurang, dan ke mana Anda perlu bergerak berikutnya."
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
        <div className="mt-5 grid gap-3">
          <div
            className="rounded-[24px] border p-4"
            style={{
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 52%, white) 100%)',
              borderColor: 'var(--ui-border)',
            }}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Sparkles className="h-4 w-4" />
              <span>Aksi berikutnya</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingAreas.length ? (
                pendingAreas.slice(0, 4).map((item) => (
                  <span
                    className="rounded-full border border-white/80 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                    key={item}
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/80 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700">
                  Semua checkpoint utama sudah terisi.
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        description="Akses bagian yang paling sering disentuh tanpa perlu menelusuri semua tab satu per satu."
      >
        <div className="grid gap-3">
          <WorkspaceActionButton
            href={createLocalizedPath(locale, '/orders')}
            icon={<Layers3 className="h-4 w-4" />}
            title="Order"
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
