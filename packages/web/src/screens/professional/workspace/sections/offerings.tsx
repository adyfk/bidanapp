'use client';

import type { ProfessionalWorkspaceSnapshot } from '@marketplace/marketplace-core';
import { EntityCard } from '@marketplace/ui/patterns';
import { EmptyState, PrimaryButton, StatusPill, TextAreaField, TextField } from '@marketplace/ui/primitives';
import type { Dispatch, SetStateAction } from 'react';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import { formatWorkspaceCurrency } from '../utils';

export function OfferingsSection({
  busy,
  form,
  isApproved,
  onChange,
  onCreate,
  snapshot,
}: {
  busy: boolean;
  form: {
    deliveryMode: string;
    description: string;
    offeringType: string;
    priceAmount: string;
    title: string;
  };
  isApproved: boolean;
  onChange: Dispatch<
    SetStateAction<{
      deliveryMode: string;
      description: string;
      offeringType: string;
      priceAmount: string;
      title: string;
    }>
  >;
  onCreate: () => Promise<void>;
  snapshot: ProfessionalWorkspaceSnapshot;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <WorkspaceSurfaceCard
        title="Composer layanan"
        description="Gunakan composer ini untuk layanan baru. Struktur dibuat lebih ringkas supaya judul, deskripsi, mode, dan harga tetap mudah discan."
      >
        {isApproved ? (
          <>
            <div
              className="rounded-[24px] border p-4"
              style={{
                background:
                  'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 48%, white) 100%)',
                borderColor: 'var(--ui-border)',
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--ui-primary)' }}
              >
                Draft baru
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Mulai dari judul paling jelas dulu, lalu jelaskan hasil utama layanan dengan bahasa yang singkat dan
                meyakinkan.
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <TextField
                label="Judul"
                value={form.title}
                onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
              />
              <TextAreaField
                label="Deskripsi"
                value={form.description}
                onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Jenis layanan"
                  helperText="Gunakan home_visit, online_session, atau digital_product."
                  value={form.offeringType}
                  onChange={(event) => onChange((current) => ({ ...current, offeringType: event.target.value }))}
                />
                <TextField
                  label="Mode"
                  helperText="Gunakan mode yang sama seperti katalog publik."
                  value={form.deliveryMode}
                  onChange={(event) => onChange((current) => ({ ...current, deliveryMode: event.target.value }))}
                />
              </div>
              <TextField
                inputMode="numeric"
                label="Harga"
                value={form.priceAmount}
                onChange={(event) => onChange((current) => ({ ...current, priceAmount: event.target.value }))}
              />
            </div>
            <div className="mt-6">
              <PrimaryButton disabled={busy || !form.title.trim()} onClick={() => void onCreate()} type="button">
                {busy ? 'Menyimpan...' : 'Publikasikan layanan'}
              </PrimaryButton>
            </div>
          </>
        ) : (
          <EmptyState
            title="Layanan belum bisa dipublikasikan"
            description="Tunggu sampai profil dan aplikasi Anda disetujui terlebih dahulu."
          />
        )}
      </WorkspaceSurfaceCard>

      <WorkspaceSurfaceCard
        title="Layanan aktif"
        description="Kartu layanan aktif menahan judul dan deskripsi panjang dengan lebih aman sambil menjaga harga tetap menonjol."
      >
        {(snapshot.offerings ?? []).length ? (
          <div className="space-y-4">
            {(snapshot.offerings ?? []).map((offering) => (
              <EntityCard
                key={offering.id}
                badge={<StatusPill tone="accent">{offering.status}</StatusPill>}
                description={`${offering.offeringType} • ${offering.deliveryMode}`}
                meta={
                  <div className="space-y-2">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                      Harga
                      <div className="mt-1 text-[14px] font-bold text-slate-900">
                        {formatWorkspaceCurrency(offering.priceAmount, offering.currency)}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-500">
                      Slug publik
                      <div className="mt-1 break-words text-[13px] font-semibold text-slate-900 [overflow-wrap:anywhere]">
                        {offering.slug}
                      </div>
                    </div>
                  </div>
                }
                title={offering.title}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada offering"
            description="Publish offering pertama untuk mengaktifkan catalog dan order flow publik."
          />
        )}
      </WorkspaceSurfaceCard>
    </div>
  );
}
