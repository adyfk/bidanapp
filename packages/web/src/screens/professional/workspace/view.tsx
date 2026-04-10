'use client';

import { createMarketplaceApiClient } from '@marketplace/marketplace-core/client';
import {
  createProfessionalPlatformOffering,
  fetchProfessionalWorkspaceOrders,
  fetchProfessionalWorkspaceSnapshot,
  type ProfessionalWorkspaceSnapshot,
  replaceProfessionalWorkspaceAvailability,
  replaceProfessionalWorkspaceCoverage,
  replaceProfessionalWorkspacePortfolio,
  replaceProfessionalWorkspaceTrust,
  updateProfessionalWorkspaceNotifications,
  upsertProfessionalWorkspaceProfile,
} from '@marketplace/marketplace-core/professional';
import { fetchViewerAuthSession, type ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import { getServicePlatformConfig, type ServicePlatformId } from '@marketplace/platform-config';
import {
  MarketplaceEmptyCard,
  MarketplaceHeaderIconButton,
  MarketplaceIdentityCard,
  MarketplaceSurfaceCard,
  MarketplaceTopPill,
} from '@marketplace/ui/marketplace-lite';
import { EmptyState, MessageBanner } from '@marketplace/ui/primitives';
import { ArrowRight, Bell, BriefcaseMedical, Compass, Layers3, MapPin, Star, UserRound, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../../../lib/env';
import { createLocalizedPath } from '../../../lib/platform';
import { type ProfessionalDashboardSection, professionalConsoleSections } from '../../../screen-config/sections';
import { WorkspaceActionButton } from './parts/action-button';
import { WorkspaceInfoChip } from './parts/info-chip';
import { WorkspaceMetricCard } from './parts/metric-card';
import { ProfessionalTabGrid } from './parts/tab-grid';
import { OverviewSection } from './sections/overview';
import type {
  AvailabilityRuleForm,
  CoverageAreaForm,
  CredentialForm,
  GalleryAssetForm,
  PortfolioEntryForm,
  StoryForm,
} from './types';
import { formatWorkspaceCurrency } from './utils';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

function WorkspaceSectionLoading() {
  return (
    <MarketplaceSurfaceCard>
      <p className="text-sm leading-6 text-gray-500">Menyiapkan section dashboard...</p>
    </MarketplaceSurfaceCard>
  );
}

const AvailabilitySection = dynamic(() => import('./sections/availability').then((mod) => mod.AvailabilitySection), {
  loading: WorkspaceSectionLoading,
});
const CoverageSection = dynamic(() => import('./sections/coverage').then((mod) => mod.CoverageSection), {
  loading: WorkspaceSectionLoading,
});
const NotificationSection = dynamic(() => import('./sections/notifications').then((mod) => mod.NotificationSection), {
  loading: WorkspaceSectionLoading,
});
const OfferingsSection = dynamic(() => import('./sections/offerings').then((mod) => mod.OfferingsSection), {
  loading: WorkspaceSectionLoading,
});
const OrdersSection = dynamic(() => import('./sections/orders').then((mod) => mod.OrdersSection), {
  loading: WorkspaceSectionLoading,
});
const PortfolioSection = dynamic(() => import('./sections/portfolio').then((mod) => mod.PortfolioSection), {
  loading: WorkspaceSectionLoading,
});
const ProfileSection = dynamic(() => import('./sections/profile').then((mod) => mod.ProfileSection), {
  loading: WorkspaceSectionLoading,
});
const TrustSection = dynamic(() => import('./sections/trust').then((mod) => mod.TrustSection), {
  loading: WorkspaceSectionLoading,
});

export function ProfessionalWorkspacePage({
  authHref,
  initialSession,
  locale,
  platformId,
  section,
}: {
  authHref: string;
  initialSession?: ViewerSession | null;
  locale: string;
  platformId: ServicePlatformId;
  section: ProfessionalDashboardSection;
}) {
  const platform = getServicePlatformConfig(platformId);
  const [snapshot, setSnapshot] = useState<ProfessionalWorkspaceSnapshot | null>(null);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntryForm[]>([]);
  const [galleryAssets, setGalleryAssets] = useState<GalleryAssetForm[]>([]);
  const [credentials, setCredentials] = useState<CredentialForm[]>([]);
  const [stories, setStories] = useState<StoryForm[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<CoverageAreaForm[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRuleForm[]>([]);
  const [profileForm, setProfileForm] = useState({
    city: '',
    displayName: '',
    slug: '',
  });
  const [offeringForm, setOfferingForm] = useState({
    deliveryMode: 'home_visit',
    description: '',
    offeringType: 'home_visit',
    priceAmount: '150000',
    title: '',
  });
  const [notificationForm, setNotificationForm] = useState({
    emailEnabled: true,
    webEnabled: true,
    whatsappEnabled: true,
  });

  const currentSection = useMemo(
    () => professionalConsoleSections.find((item) => item.id === section) ?? professionalConsoleSections[0],
    [section],
  );

  const isApproved = snapshot?.application?.status === 'approved' && snapshot?.profile?.reviewStatus === 'approved';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback('');
      const sessionPayload = await fetchViewerAuthSession(client);
      setSession(sessionPayload);

      if (!sessionPayload.isAuthenticated) {
        setSnapshot(null);
        return;
      }

      const [workspacePayload, ordersPayload] = await Promise.all([
        fetchProfessionalWorkspaceSnapshot(client, platformId),
        fetchProfessionalWorkspaceOrders(client, platformId),
      ]);

      const mergedSnapshot: ProfessionalWorkspaceSnapshot = {
        ...workspacePayload,
        recentOrders: ordersPayload.orders,
      };

      setSnapshot(mergedSnapshot);
      setProfileForm({
        city: mergedSnapshot.profile?.city || sessionPayload.customerProfile?.city || '',
        displayName: mergedSnapshot.profile?.displayName || sessionPayload.customerProfile?.displayName || '',
        slug: mergedSnapshot.profile?.slug || '',
      });
      setPortfolioEntries(
        (mergedSnapshot.portfolioEntries ?? []).map((entry) => ({
          assetUrl: entry.assetUrl || '',
          description: entry.description || '',
          id: entry.id,
          sortOrder: String(entry.sortOrder ?? 0),
          title: entry.title || '',
        })),
      );
      setGalleryAssets(
        (mergedSnapshot.galleryAssets ?? []).map((asset) => ({
          assetUrl: asset.assetUrl || '',
          caption: asset.caption || '',
          fileName: asset.fileName || '',
          id: asset.id,
          sortOrder: String(asset.sortOrder ?? 0),
        })),
      );
      setCredentials(
        (mergedSnapshot.credentials ?? []).map((credential) => ({
          credentialCode: credential.credentialCode || '',
          expiresAt: credential.expiresAt || '',
          id: credential.id,
          issuedAt: credential.issuedAt || '',
          issuer: credential.issuer || '',
          label: credential.label || '',
        })),
      );
      setStories(
        (mergedSnapshot.stories ?? []).map((story) => ({
          body: story.body || '',
          id: story.id,
          isPublished: Boolean(story.isPublished),
          sortOrder: String(story.sortOrder ?? 0),
          title: story.title || '',
        })),
      );
      setCoverageAreas(
        (mergedSnapshot.coverageAreas ?? []).map((area) => ({
          areaLabel: area.areaLabel || '',
          city: area.city || '',
          id: area.id,
        })),
      );
      setAvailabilityRules(
        (mergedSnapshot.availabilityRules ?? []).map((rule) => ({
          endTime: rule.endTime || '',
          id: rule.id,
          isUnavailable: Boolean(rule.isUnavailable),
          startTime: rule.startTime || '',
          weekday: String(rule.weekday ?? 1),
        })),
      );
      setNotificationForm({
        emailEnabled: mergedSnapshot.notificationPreferences?.emailEnabled ?? true,
        webEnabled: mergedSnapshot.notificationPreferences?.webEnabled ?? true,
        whatsappEnabled: mergedSnapshot.notificationPreferences?.whatsappEnabled ?? true,
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memuat dashboard profesional.');
    } finally {
      setLoading(false);
    }
  }, [platformId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const payload = await upsertProfessionalWorkspaceProfile(client, platformId, {
        attributes: snapshot?.profile?.attributes ?? {},
        city: profileForm.city,
        displayName: profileForm.displayName,
        slug: profileForm.slug,
      });
      setSnapshot(payload);
      setFeedback('Profil profesional berhasil diperbarui.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui profil profesional.');
    } finally {
      setBusy(false);
    }
  };

  const savePortfolio = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const payload = await replaceProfessionalWorkspacePortfolio(client, platformId, {
        entries: portfolioEntries
          .filter((entry) => entry.title.trim() || entry.description.trim() || entry.assetUrl.trim())
          .map((entry, index) => ({
            assetUrl: entry.assetUrl,
            description: entry.description,
            id: entry.id,
            sortOrder: Number(entry.sortOrder || index),
            title: entry.title,
          })),
        gallery: galleryAssets
          .filter((asset) => asset.caption.trim() || asset.fileName.trim() || asset.assetUrl.trim())
          .map((asset, index) => ({
            assetUrl: asset.assetUrl,
            caption: asset.caption,
            fileName: asset.fileName,
            id: asset.id,
            sortOrder: Number(asset.sortOrder || index),
          })),
      });
      setSnapshot(payload);
      setFeedback('Portfolio profesional berhasil diperbarui.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui portfolio.');
    } finally {
      setBusy(false);
    }
  };

  const saveTrust = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const payload = await replaceProfessionalWorkspaceTrust(client, platformId, {
        credentials: credentials
          .filter((item) => item.label.trim() || item.issuer.trim() || item.credentialCode.trim())
          .map((item) => ({
            credentialCode: item.credentialCode,
            expiresAt: item.expiresAt || undefined,
            id: item.id,
            issuedAt: item.issuedAt || undefined,
            issuer: item.issuer,
            label: item.label,
          })),
        stories: stories
          .filter((item) => item.title.trim() || item.body.trim())
          .map((item, index) => ({
            body: item.body,
            id: item.id,
            isPublished: item.isPublished,
            sortOrder: Number(item.sortOrder || index),
            title: item.title,
          })),
      });
      setSnapshot(payload);
      setFeedback('Trust layer profesional berhasil diperbarui.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui trust layer.');
    } finally {
      setBusy(false);
    }
  };

  const saveCoverage = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const payload = await replaceProfessionalWorkspaceCoverage(client, platformId, {
        areas: coverageAreas
          .filter((area) => area.areaLabel.trim() || area.city.trim())
          .map((area) => ({
            areaLabel: area.areaLabel,
            city: area.city,
            id: area.id,
          })),
      });
      setSnapshot(payload);
      setFeedback('Coverage area berhasil diperbarui.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui coverage.');
    } finally {
      setBusy(false);
    }
  };

  const saveAvailability = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const payload = await replaceProfessionalWorkspaceAvailability(client, platformId, {
        rules: availabilityRules
          .filter((rule) => rule.startTime.trim() || rule.endTime.trim())
          .map((rule) => ({
            endTime: rule.endTime,
            id: rule.id,
            isUnavailable: rule.isUnavailable,
            startTime: rule.startTime,
            weekday: Number(rule.weekday || 1),
          })),
      });
      setSnapshot(payload);
      setFeedback('Availability rules berhasil diperbarui.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui availability.');
    } finally {
      setBusy(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setBusy(true);
      setFeedback('');
      const payload = await updateProfessionalWorkspaceNotifications(client, platformId, notificationForm);
      setSnapshot(payload);
      setFeedback('Preferensi notifikasi berhasil diperbarui.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui preferensi notifikasi.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateOffering = async () => {
    try {
      setBusy(true);
      setFeedback('');
      await createProfessionalPlatformOffering(client, platformId, {
        deliveryMode: offeringForm.deliveryMode,
        description: offeringForm.description,
        offeringType: offeringForm.offeringType,
        priceAmount: Number(offeringForm.priceAmount || 0),
        title: offeringForm.title,
      });
      setOfferingForm({
        deliveryMode: 'home_visit',
        description: '',
        offeringType: 'home_visit',
        priceAmount: '150000',
        title: '',
      });
      setFeedback('Offering baru berhasil dipublish.');
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal membuat offering.');
    } finally {
      setBusy(false);
    }
  };

  const sectionHref = (path: string) => createLocalizedPath(locale, `/professionals/dashboard${path}`);
  const loginHref = createLocalizedPath(locale, '/login');
  const locationLabel =
    snapshot?.profile?.city ||
    session?.customerProfile?.city ||
    (locale.startsWith('en') ? 'Selected area' : 'Area pilihan');
  const offerings = snapshot?.offerings ?? [];
  const averagePriceValue = offerings.length
    ? Math.round(offerings.reduce((total, item) => total + item.priceAmount, 0) / offerings.length)
    : 0;
  const completionScore = Math.max(
    16,
    Math.min(
      100,
      [
        snapshot?.profile?.displayName ? 20 : 0,
        snapshot?.profile?.city ? 15 : 0,
        (snapshot?.application?.documents ?? []).length ? 20 : 0,
        (snapshot?.offerings ?? []).length ? 20 : 0,
        (snapshot?.coverageAreas ?? []).length ? 15 : 0,
        (snapshot?.availabilityRules ?? []).length ? 10 : 0,
      ].reduce((sum, value) => sum + value, 0),
    ),
  );
  const responseTimeGoal =
    (typeof snapshot?.profile?.attributes?.responseTimeGoal === 'string' &&
      snapshot.profile.attributes.responseTimeGoal) ||
    '≤ 30 menit';
  const publicProfileHref = snapshot?.profile?.slug
    ? createLocalizedPath(locale, `/p/${snapshot.profile.slug}`)
    : createLocalizedPath(locale, '/profile');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ui-background)' }}>
      <div className="mx-auto flex min-h-screen justify-center">
        <div className="relative flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white shadow-[0_18px_50px_-26px_rgba(15,23,42,0.28)]">
          {!session?.isAuthenticated ? (
            <div
              className="flex min-h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
              style={{ backgroundColor: 'var(--ui-background)' }}
            >
              <div
                className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/92 px-4 pb-4 pt-14 backdrop-blur-sm"
                style={{ borderColor: 'var(--ui-border)' }}
              >
                <MarketplaceHeaderIconButton href={createLocalizedPath(locale, '/')}>
                  <span aria-hidden="true">‹</span>
                </MarketplaceHeaderIconButton>
                <p className="text-[15px] font-bold text-gray-900">Akses profesional</p>
                <div className="w-10" />
              </div>

              <div className="space-y-5 px-5 py-6">
                <section
                  className="overflow-hidden rounded-[30px] border p-6 text-white"
                  style={{
                    background: 'var(--ui-hero-gradient)',
                    borderColor: 'color-mix(in srgb, var(--ui-primary) 18%, white)',
                    boxShadow: 'var(--ui-shadow-hero)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white/12 text-white shadow-sm">
                      <BriefcaseMedical className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/92">
                          Jalur profesional
                        </span>
                        <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/84">
                          {platform.name}
                        </span>
                      </div>
                      <h1 className="mt-3 text-[26px] font-bold leading-tight text-white">
                        Masuk dulu untuk membuka area kerja profesional
                      </h1>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/82">
                        Setelah masuk, Anda bisa mengatur layanan aktif, halaman profesional, dokumen, dan jadwal kerja.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-2 gap-2 rounded-full bg-gray-100 p-1">
                    <a
                      href={loginHref}
                      className="rounded-full bg-white px-4 py-3 text-center text-[13px] font-bold text-gray-900 shadow-sm transition-all"
                    >
                      Masuk
                    </a>
                    <a
                      href={createLocalizedPath(locale, '/professionals/apply')}
                      className="rounded-full px-4 py-3 text-center text-[13px] font-bold text-gray-500 transition-all hover:text-gray-700"
                    >
                      Daftar
                    </a>
                  </div>

                  <div className="mt-5 rounded-[18px] bg-gray-50 px-4 py-3">
                    <p className="text-[12px] font-semibold text-gray-500">Akses profesional</p>
                    <p className="mt-1 text-[14px] font-bold text-gray-900">
                      Kelola layanan dan halaman profesional Anda
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                      Satu jalur untuk review, portofolio, layanan aktif, dan permintaan pelanggan.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <a href={loginHref}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white transition-transform active:scale-[0.99]"
                        style={{ backgroundColor: 'var(--ui-primary)' }}
                      >
                        Masuk sebagai profesional
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </a>
                    <a href={authHref}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Keamanan akun
                      </button>
                    </a>
                  </div>
                </section>

                <MarketplaceEmptyCard
                  title="Masuk untuk membuka area kerja"
                  description="Area kerja profesional akan muncul di sini setelah Anda menyelesaikan login."
                />
              </div>
            </div>
          ) : loading ? (
            <div
              className="flex min-h-full flex-col px-5 pb-10 pt-6"
              style={{ backgroundColor: 'var(--ui-background)' }}
            >
              <MarketplaceIdentityCard
                chip={<MarketplaceTopPill tone="soft">Dashboard profesional</MarketplaceTopPill>}
                subtitle="Sebentar ya, kami sedang menyiapkan profil dan aktivitas profesional Anda."
                title="Memuat dashboard"
              />
              <MarketplaceSurfaceCard className="mt-5">
                <p className="text-sm leading-6 text-gray-500">
                  Mengambil data terbaru untuk halaman profesional Anda.
                </p>
              </MarketplaceSurfaceCard>
            </div>
          ) : !snapshot ? (
            <div
              className="flex min-h-full flex-col px-5 pb-10 pt-6"
              style={{ backgroundColor: 'var(--ui-background)' }}
            >
              <MarketplaceIdentityCard
                chip={<MarketplaceTopPill tone="soft">Dashboard profesional</MarketplaceTopPill>}
                subtitle="Akun ini belum memiliki profil profesional yang siap digunakan."
                title="Profil profesional belum siap"
              />
              <MarketplaceSurfaceCard className="mt-5">
                <EmptyState
                  title="Profil belum siap"
                  description="Lengkapi pengajuan profesional Anda terlebih dahulu agar dashboard bisa dipakai."
                />
              </MarketplaceSurfaceCard>
            </div>
          ) : (
            <div
              className="flex h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
              style={{ backgroundColor: 'var(--ui-background)' }}
            >
              <div
                className="sticky top-0 z-20 px-5 pb-5 pt-12 backdrop-blur-sm"
                style={{
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--ui-background) 96%, white) 0%, rgba(244,248,251,0.88) 72%, rgba(244,248,251,0) 100%)',
                }}
              >
                <div className="flex items-center justify-between rounded-[28px] border border-white/80 bg-white/72 px-4 py-3 shadow-[0_22px_48px_-36px_rgba(15,23,42,0.22)] backdrop-blur-md">
                  <a
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white text-[13px] font-bold shadow-sm transition-opacity hover:opacity-80"
                    href={createLocalizedPath(locale, '/profile')}
                    style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
                  >
                    {(snapshot.profile?.displayName || session.customerProfile?.displayName || 'B')
                      .charAt(0)
                      .toUpperCase()}
                  </a>
                  <div className="flex min-w-0 flex-1 flex-col items-center px-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      DASHBOARD PROFESIONAL
                    </span>
                    <div className="mt-1 flex max-w-full items-center text-[14px] font-bold text-gray-900">
                      <MapPin className="mr-1 h-4 w-4 flex-shrink-0" style={{ color: 'var(--ui-primary)' }} />
                      <span className="truncate">{locationLabel}</span>
                    </div>
                  </div>
                  <a
                    aria-label="Buka notifikasi"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                    href={createLocalizedPath(locale, '/notifications')}
                  >
                    <Bell className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="space-y-5 px-5 py-6">
                {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

                <div className="flex flex-wrap gap-2">
                  <WorkspaceInfoChip label="Kelengkapan" value={`${completionScore}%`} />
                  <WorkspaceInfoChip label="Respons" value={responseTimeGoal} />
                </div>

                <section className="grid grid-cols-2 gap-3">
                  <WorkspaceMetricCard
                    icon={<Star className="h-4 w-4" />}
                    label="Peninjauan"
                    value={snapshot.profile?.reviewStatus || 'draft'}
                  />
                  <WorkspaceMetricCard
                    icon={<Wallet className="h-4 w-4" />}
                    label="Rata-rata harga"
                    value={formatWorkspaceCurrency(averagePriceValue, 'IDR')}
                  />
                  <WorkspaceMetricCard
                    icon={<Layers3 className="h-4 w-4" />}
                    label="Layanan aktif"
                    value={String((snapshot.offerings ?? []).length)}
                  />
                  <WorkspaceMetricCard
                    icon={<MapPin className="h-4 w-4" />}
                    label="Jangkauan"
                    value={`${(snapshot.coverageAreas ?? []).length} area`}
                  />
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <WorkspaceActionButton
                    href={publicProfileHref}
                    icon={<UserRound className="h-4 w-4" />}
                    title="Lihat profil publik"
                    variant="primary"
                  />
                  <WorkspaceActionButton
                    href={createLocalizedPath(locale, '/explore')}
                    icon={<Compass className="h-4 w-4" />}
                    title="Lihat katalog"
                    variant="secondary"
                  />
                </div>

                <ProfessionalTabGrid
                  items={professionalConsoleSections.map((item) => ({
                    href: sectionHref(item.path),
                    id: item.id,
                    label: item.label,
                  }))}
                  value={currentSection.id}
                />

                {currentSection.id === 'overview' ? <OverviewSection locale={locale} snapshot={snapshot} /> : null}
                {currentSection.id === 'orders' ? <OrdersSection snapshot={snapshot} /> : null}
                {currentSection.id === 'offerings' ? (
                  <OfferingsSection
                    busy={busy}
                    form={offeringForm}
                    isApproved={Boolean(isApproved)}
                    onChange={setOfferingForm}
                    onCreate={handleCreateOffering}
                    snapshot={snapshot}
                  />
                ) : null}
                {currentSection.id === 'portfolio' ? (
                  <PortfolioSection
                    busy={busy}
                    galleryAssets={galleryAssets}
                    onSave={savePortfolio}
                    portfolioEntries={portfolioEntries}
                    setGalleryAssets={setGalleryAssets}
                    setPortfolioEntries={setPortfolioEntries}
                  />
                ) : null}
                {currentSection.id === 'trust' ? (
                  <TrustSection
                    busy={busy}
                    credentials={credentials}
                    onSave={saveTrust}
                    setCredentials={setCredentials}
                    setStories={setStories}
                    stories={stories}
                  />
                ) : null}
                {currentSection.id === 'coverage' ? (
                  <CoverageSection
                    busy={busy}
                    coverageAreas={coverageAreas}
                    onSave={saveCoverage}
                    setCoverageAreas={setCoverageAreas}
                  />
                ) : null}
                {currentSection.id === 'availability' ? (
                  <AvailabilitySection
                    busy={busy}
                    availabilityRules={availabilityRules}
                    onSave={saveAvailability}
                    setAvailabilityRules={setAvailabilityRules}
                  />
                ) : null}
                {currentSection.id === 'notifications' ? (
                  <NotificationSection
                    busy={busy}
                    form={notificationForm}
                    onChange={setNotificationForm}
                    onSave={saveNotifications}
                  />
                ) : null}
                {currentSection.id === 'profile' ? (
                  <ProfileSection
                    busy={busy}
                    form={profileForm}
                    locale={locale}
                    onChange={setProfileForm}
                    onSave={saveProfile}
                    snapshot={snapshot}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
