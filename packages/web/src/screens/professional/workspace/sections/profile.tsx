'use client';

import type { ProfessionalWorkspaceSnapshot } from '@marketplace/marketplace-core';
import {
  MarketplaceIdentityCard,
  MarketplaceListCard,
  MarketplaceProfileSettingsSheet,
  MarketplaceQuickActionCard,
  MarketplaceSettingsCard,
  MarketplaceSettingsRow,
  MarketplaceSupportEntryCard,
  MarketplaceSupportSheet,
} from '@marketplace/ui/marketplace-lite';
import { PrimaryButton, StatusPill, TextField } from '@marketplace/ui/primitives';
import { LayoutDashboard, LifeBuoy, MapPin, UserRound } from 'lucide-react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { createLocalizedPath } from '../../../../lib/platform';
import { WorkspaceSurfaceCard } from '../parts/surface-card';

function readAttribute(attributes: Record<string, unknown> | undefined, key: string) {
  const value = attributes?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function ProfileSection({
  busy,
  form,
  locale,
  onChange,
  onSave,
  snapshot,
}: {
  busy: boolean;
  form: {
    city: string;
    displayName: string;
    slug: string;
  };
  locale: string;
  onChange: Dispatch<
    SetStateAction<{
      city: string;
      displayName: string;
      slug: string;
    }>
  >;
  onSave: () => Promise<void>;
  snapshot: ProfessionalWorkspaceSnapshot;
}) {
  const [activeSheet, setActiveSheet] = useState<'account' | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const attributes = snapshot.profile?.attributes;
  const headline = readAttribute(attributes, 'headline');
  const bio = readAttribute(attributes, 'bio');
  const responseTimeGoal = readAttribute(attributes, 'responseTimeGoal');
  const publicHref = form.slug
    ? createLocalizedPath(locale, `/p/${form.slug}`)
    : createLocalizedPath(locale, '/professionals/dashboard');

  return (
    <WorkspaceSurfaceCard
      description="Kelola identitas publik, pintasan kerja, dan ringkasan profil profesional Anda."
      title="Profil publik"
    >
      <div className="space-y-6">
        <MarketplaceIdentityCard
          actionLabel="Edit profil"
          chipIcon={<MapPin className="h-3.5 w-3.5" />}
          chipLabel={form.city || 'Kota belum diatur'}
          onAction={() => setActiveSheet('account')}
          subtitle={headline || 'Ringkasan profesional ini akan muncul di halaman yang dilihat customer.'}
          title={form.displayName || 'Profil profesional'}
        />

        <div className="grid grid-cols-2 gap-3">
          <MarketplaceQuickActionCard
            description="Kembali ke overview untuk melihat ringkasan order dan status kerja."
            icon={<LayoutDashboard className="h-5 w-5" />}
            onClick={() => {
              window.location.href = createLocalizedPath(locale, '/professionals/dashboard');
            }}
            title="Dashboard"
          />
          <MarketplaceQuickActionCard
            description="Tinjau tampilan publik profil profesional Anda."
            icon={<UserRound className="h-5 w-5" />}
            onClick={() => {
              window.location.href = publicHref;
            }}
            title="Halaman profesional"
          />
        </div>

        <MarketplaceSupportEntryCard
          actionLabel="Lihat panduan"
          badges={['Verifikasi', 'Dokumen', 'Payout']}
          description="Buka panduan singkat bila Anda butuh bantuan untuk dokumen, review, atau pembaruan profil."
          icon={<LifeBuoy className="h-5 w-5" />}
          onClick={() => setSupportOpen(true)}
          responseBadge="Desk aktif"
          title="Butuh bantuan workspace?"
        />

        <MarketplaceSettingsCard>
          <MarketplaceSettingsRow
            description="Perbarui nama tampil, kota, dan slug publik Anda."
            icon={<UserRound className="h-4 w-4" />}
            iconClassName="bg-sky-50 text-sky-600"
            onClick={() => setActiveSheet('account')}
            title="Akun publik"
          />
          <MarketplaceSettingsRow
            description={responseTimeGoal || 'Tambahkan target respon agar calon pelanggan tahu ritme layanan Anda.'}
            icon={<MapPin className="h-4 w-4" />}
            iconClassName="bg-teal-50 text-teal-700"
            title="Status review"
            trailing={
              <StatusPill tone="accent">
                {snapshot.profile?.reviewStatus || snapshot.application?.status || 'draft'}
              </StatusPill>
            }
          />
          <MarketplaceSettingsRow
            description={
              form.slug ? `/${locale}/p/${form.slug}` : 'Buat slug agar halaman profesional mudah dibagikan.'
            }
            icon={<LayoutDashboard className="h-4 w-4" />}
            iconClassName="bg-slate-100 text-slate-600"
            isLast
            title="Tautan halaman"
            trailing={
              <a className="text-[12px] font-semibold text-slate-500" href={publicHref}>
                Buka
              </a>
            }
          />
        </MarketplaceSettingsCard>

        <div className="space-y-3">
          {headline || bio ? (
            <MarketplaceListCard
              description={bio || 'Tambahkan bio singkat agar halaman profesional terasa lebih meyakinkan.'}
              subtitle={responseTimeGoal || 'Target respon belum diatur'}
              title={headline || 'Headline profesional'}
            />
          ) : null}
          <MarketplaceListCard
            description="Portofolio, trust, coverage, dan availability bisa dilanjutkan dari tab workspace lain tanpa meninggalkan dashboard."
            subtitle="Pintasan workspace"
            title="Lanjutkan pengisian profil"
          />
        </div>
      </div>

      <MarketplaceProfileSettingsSheet
        description="Perbarui nama tampil, kota, dan tautan agar profil profesional tetap konsisten."
        isOpen={activeSheet === 'account'}
        onClose={() => setActiveSheet(null)}
        title="Edit profil profesional"
      >
        <div className="space-y-4">
          <TextField
            label="Nama tampil"
            value={form.displayName}
            onChange={(event) => onChange((current) => ({ ...current, displayName: event.target.value }))}
          />
          <TextField
            label="Kota"
            value={form.city}
            onChange={(event) => onChange((current) => ({ ...current, city: event.target.value }))}
          />
          <TextField
            helperText="Slug dipakai pada tautan halaman profesional Anda."
            label="Slug halaman"
            value={form.slug}
            onChange={(event) => onChange((current) => ({ ...current, slug: event.target.value }))}
          />
          <PrimaryButton
            disabled={busy}
            onClick={() => {
              void onSave().then(() => setActiveSheet(null));
            }}
            type="button"
          >
            {busy ? 'Menyimpan...' : 'Simpan profil'}
          </PrimaryButton>
        </div>
      </MarketplaceProfileSettingsSheet>

      <MarketplaceSupportSheet
        description="Gunakan panduan ini saat Anda perlu menyiapkan dokumen, menunggu review, atau merapikan halaman profesional."
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Panduan workspace"
      >
        <div className="space-y-3">
          <MarketplaceListCard
            description="Pastikan nama tampil, kota, dan slug sudah rapi sebelum membagikan halaman profesional."
            title="Rapikan halaman profesional"
          />
          <MarketplaceListCard
            description="Lengkapi trust, coverage, dan availability agar halaman publik lebih siap untuk menerima order."
            title="Lengkapi section kerja"
          />
          <MarketplaceListCard
            description="Buka overview untuk memantau status review, ringkasan order, dan progres workspace."
            title="Pantau status review"
            accessory={
              <a
                className="text-[12px] font-semibold text-slate-500"
                href={createLocalizedPath(locale, '/professionals/dashboard')}
              >
                Buka
              </a>
            }
          />
        </div>
      </MarketplaceSupportSheet>
    </WorkspaceSurfaceCard>
  );
}
