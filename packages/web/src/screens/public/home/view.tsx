'use client';

import type { DirectoryOffering, DirectoryProfessional } from '@marketplace/marketplace-core/directory';
import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import type { ServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceCategoryTile,
  MarketplaceFeaturePill,
  MarketplaceMobileShell,
  MarketplaceSearchField,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
} from '@marketplace/ui/marketplace-lite';
import { PrimaryButton, SecondaryButton } from '@marketplace/ui/primitives';
import { ArrowRight, Bell, Calendar, HeartHandshake, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import { currentCity, profileInitial, viewerLabel } from '../shared/parts/portrait';
import { ProfessionalCard } from '../shared/parts/professional-card';
import { HomeServiceTile } from './parts/home-service-tile';

export function MarketplaceHomeView({
  currentPath,
  locale,
  loginHref,
  notificationsHref,
  ordersHref,
  platform,
  profileHref,
  professionals,
  servicesHref,
  session,
  supportHref,
  offerings,
}: {
  currentPath: string;
  locale: string;
  loginHref: string;
  notificationsHref: string;
  ordersHref: string;
  platform: ServicePlatformConfig;
  profileHref: string;
  professionals: DirectoryProfessional[];
  offerings: DirectoryOffering[];
  servicesHref: string;
  session?: ViewerSession | null;
  supportHref: string;
}) {
  void currentPath;
  const en = isEnglishLocale(locale);
  const isAuthenticated = Boolean(session?.isAuthenticated);
  const presentation = platform.presentation;
  const trustPills = en ? ['Home visit', 'Lactation', 'Follow-up'] : ['Home visit', 'Laktasi', 'Follow-up'];

  return (
    <MarketplaceMobileShell activeNavId="home" navItems={createPrimaryMarketplaceNav(platform, locale)}>
      <div className="flex min-h-full flex-col pb-24" style={{ backgroundColor: 'var(--ui-background)' }}>
        <div
          className="sticky top-0 z-20 px-5 pb-4 pt-12 backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--ui-background) 94%, white) 0%, rgba(255,252,254,0.76) 78%, rgba(255,252,254,0) 100%)',
          }}
        >
          <div className="flex items-center justify-between rounded-[28px] border bg-white/88 px-4 py-3 shadow-[0_18px_42px_-34px_rgba(88,49,66,0.16)] backdrop-blur-xl">
            <a
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border text-sm font-bold"
              href={session?.isAuthenticated ? profileHref : loginHref}
              style={{
                background:
                  'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 100%)',
                borderColor: 'var(--ui-border)',
                color: 'var(--ui-primary)',
              }}
            >
              <span>{profileInitial(session)}</span>
            </a>
            <div className="min-w-0 flex-1 px-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {en ? 'BidanCare home' : 'Home BidanCare'}
              </p>
              <div className="mt-1 flex items-center justify-center text-[14px] font-bold text-slate-900">
                <MapPin className="mr-1 h-4 w-4 flex-shrink-0" style={{ color: 'var(--ui-primary)' }} />
                <span className="truncate">{currentCity(session, professionals, locale)}</span>
              </div>
            </div>
            <a
              className="relative flex h-11 w-11 items-center justify-center rounded-full border bg-white text-slate-700"
              href={notificationsHref}
              style={{ borderColor: 'var(--ui-border)' }}
            >
              <Bell className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="px-5">
          <a href={servicesHref}>
            <MarketplaceSearchField
              leading={<Search className="h-5 w-5" />}
              placeholder={en ? 'Search services, topics, or concerns' : 'Cari layanan, topik, atau kebutuhan'}
              value=""
            />
          </a>
        </div>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {trustPills.map((pill) => (
            <MarketplaceFeaturePill key={pill} tone="soft">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{pill}</span>
            </MarketplaceFeaturePill>
          ))}
        </div>

        <div className="space-y-6 px-5 pb-12 pt-5">
          <section>
            <MarketplaceSectionHeader title={presentation.activityTitle} />

            {!isAuthenticated ? (
              <MarketplaceSurfaceCard tone="blush" className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-[18px]"
                    style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
                  >
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-primary)]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {en ? 'Visitor entry' : 'Jalur visitor'}
                    </div>
                    <div className="mt-3 text-[20px] font-bold leading-tight text-slate-900">
                      {en ? 'Browse first, sign in only when you are ready' : 'Jelajahi dulu, masuk saat Anda siap'}
                    </div>
                    <div className="mt-2 text-[13px] leading-6 text-slate-500">
                      {en
                        ? 'Find trusted professionals, compare services, then keep orders and support in one account.'
                        : 'Temukan profesional tepercaya, bandingkan layanan, lalu simpan order dan support dalam satu akun.'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: 'var(--ui-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {en ? 'Ready now' : 'Siap sekarang'}
                    </p>
                    <p className="mt-2 text-[15px] font-bold text-slate-900">
                      {en ? 'Explore professionals and services' : 'Jelajahi profesional dan layanan'}
                    </p>
                  </div>
                  <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: 'var(--ui-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {en ? 'Saved later' : 'Tersimpan nanti'}
                    </p>
                    <p className="mt-2 text-[15px] font-bold text-slate-900">
                      {en ? 'Orders, payment, and follow-up' : 'Order, pembayaran, dan tindak lanjut'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <a href={loginHref}>
                    <PrimaryButton className="w-full" type="button">
                      {en ? 'Sign in / register' : 'Masuk / daftar'}
                    </PrimaryButton>
                  </a>
                  <a href={`/${locale}/explore`}>
                    <SecondaryButton className="w-full" type="button">
                      {en ? 'Browse professionals' : 'Lihat profesional'}
                    </SecondaryButton>
                  </a>
                </div>
              </MarketplaceSurfaceCard>
            ) : (
              <section
                className="overflow-hidden rounded-[30px] border p-5 text-white"
                style={{
                  background: 'var(--ui-hero-gradient)',
                  borderColor: 'color-mix(in srgb, var(--ui-border-strong) 42%, white)',
                  boxShadow: 'var(--ui-shadow-hero)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                      <Calendar className="h-3.5 w-3.5" />
                      {en ? 'Customer console' : 'Ruang customer'}
                    </div>
                    <h2 className="mt-4 text-[24px] font-bold leading-tight text-white">
                      {en ? 'Keep family care easy to scan' : 'Pantau kebutuhan keluarga lebih mudah'}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/84">
                      {en
                        ? 'Orders, reminders, and support stay tidy in one calm feed.'
                        : 'Order, pengingat, dan support tetap rapi dalam satu feed yang tenang dibaca.'}
                    </p>
                  </div>
                  <a
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/24 bg-white/14 text-white"
                    href={ordersHref}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border border-white/16 bg-white/12 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
                      {en ? 'Viewer' : 'Akun aktif'}
                    </p>
                    <p className="mt-2 text-[16px] font-bold leading-snug text-white">
                      {session?.customerProfile?.displayName || (en ? 'Customer account' : 'Akun customer')}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-white/72">{viewerLabel(session, locale)}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/16 bg-white/12 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
                      {en ? 'Next actions' : 'Aksi cepat'}
                    </p>
                    <p className="mt-2 text-[15px] font-bold leading-snug text-white">
                      {en ? 'Orders and support' : 'Order dan support'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a href={ordersHref}>
                    <SecondaryButton
                      className="w-full border-white/18 bg-white/14 text-white hover:bg-white/18"
                      type="button"
                    >
                      {en ? 'Orders' : 'Order'}
                    </SecondaryButton>
                  </a>
                  <a href={supportHref}>
                    <SecondaryButton className="w-full" type="button">
                      {en ? 'Support' : 'Support'}
                    </SecondaryButton>
                  </a>
                </div>
              </section>
            )}
          </section>

          <section>
            <MarketplaceSectionHeader
              action={
                <a className="text-xs font-semibold" href={servicesHref} style={{ color: 'var(--ui-primary)' }}>
                  {en ? 'See all' : 'Lihat semua'}
                </a>
              }
              description={presentation.homeServiceSection.description}
              title={presentation.homeServiceSection.title}
            />
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3">
              {offerings.slice(0, 3).map((offering) => (
                <HomeServiceTile key={offering.id} locale={locale} offering={offering} />
              ))}
            </div>
          </section>

          <section>
            <MarketplaceSectionHeader
              title={presentation.homeCategorySection.title}
              description={presentation.homeCategorySection.description}
            />
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
              {presentation.categories.map((category) => (
                <MarketplaceCategoryTile
                  key={category.id}
                  caption={category.caption}
                  href={category.href.startsWith('/') ? `/${locale}${category.href}` : category.href}
                  label={category.label}
                />
              ))}
            </div>
          </section>

          <section>
            <MarketplaceSectionHeader
              action={
                <a className="text-xs font-semibold" href={`/${locale}/explore`} style={{ color: 'var(--ui-primary)' }}>
                  {en ? 'See all' : 'Lihat semua'}
                </a>
              }
              description={presentation.homeProfessionalSection.description}
              title={presentation.homeProfessionalSection.title}
            />
            <div className="space-y-3.5">
              {professionals.slice(0, 3).map((professional) => (
                <ProfessionalCard key={professional.id} locale={locale} professional={professional} />
              ))}
            </div>
          </section>

          <MarketplaceSurfaceCard tone="white" className="p-5">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[18px]"
                style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-bold text-slate-900">{presentation.helpTitle}</div>
                <div className="mt-2 text-[13px] leading-6 text-slate-500">{presentation.helpDescription}</div>
                <div className="mt-4">
                  <a href={supportHref}>
                    <SecondaryButton type="button">{en ? 'Support' : 'Support'}</SecondaryButton>
                  </a>
                </div>
              </div>
            </div>
          </MarketplaceSurfaceCard>
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
