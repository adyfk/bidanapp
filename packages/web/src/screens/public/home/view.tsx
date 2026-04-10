'use client';

import type { DirectoryOffering, DirectoryProfessional } from '@marketplace/marketplace-core/directory';
import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import type { ServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceCategoryTile,
  MarketplaceMobileShell,
  MarketplaceSearchField,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
} from '@marketplace/ui/marketplace-lite';
import { PrimaryButton, SecondaryButton } from '@marketplace/ui/primitives';
import { ArrowRight, Bell, Calendar, MapPin, Search, ShieldCheck } from 'lucide-react';
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

  return (
    <MarketplaceMobileShell activeNavId="home" navItems={createPrimaryMarketplaceNav(platform, locale)}>
      <div className="flex min-h-full flex-col pb-24" style={{ backgroundColor: 'var(--ui-background)' }}>
        <div
          className="sticky top-0 z-20 px-6 pb-6 pt-14 backdrop-blur-sm"
          style={{ backgroundColor: 'color-mix(in srgb, var(--ui-background) 94%, white)' }}
        >
          <div className="flex items-center justify-between">
            <a
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border shadow-sm"
              href={session?.isAuthenticated ? profileHref : loginHref}
              style={{
                backgroundColor: 'var(--ui-surface-muted)',
                borderColor: 'var(--ui-border)',
                color: 'var(--ui-primary)',
              }}
            >
              <span className="text-sm font-bold">{profileInitial(session)}</span>
            </a>
            <div className="text-center">
              <div className="text-[11px] font-medium tracking-wide text-gray-400">{en ? 'Location' : 'Lokasi'}</div>
              <div className="flex items-center text-[14px] font-bold text-gray-900">
                <MapPin className="mr-1 h-4 w-4" style={{ color: 'var(--ui-primary)' }} />
                {currentCity(session, professionals, locale)}
              </div>
            </div>
            <a
              className="relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm"
              href={notificationsHref}
              style={{ backgroundColor: '#ffffff', borderColor: 'var(--ui-border)', color: '#1f2937' }}
            >
              <Bell className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="px-6">
          <a href={servicesHref}>
            <MarketplaceSearchField
              leading={<Search className="h-5 w-5" />}
              placeholder={en ? 'Search services, topics, or concerns' : 'Cari layanan, topik, atau kebutuhan'}
              value=""
            />
          </a>
        </div>

        <div className="space-y-7 px-6 pb-12 pt-7">
          <section>
            <MarketplaceSectionHeader title={presentation.activityTitle} />
            {!isAuthenticated ? (
              <MarketplaceSurfaceCard tone="white" className="p-6">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-[18px] font-bold text-gray-900">{presentation.activityTitle}</div>
                <div className="mt-2 text-[14px] leading-relaxed text-gray-500">{presentation.activityDescription}</div>
                <div className="mt-5 flex flex-col gap-3">
                  <a href={loginHref}>
                    <PrimaryButton className="w-full" type="button">
                      {en ? 'Sign in / register' : 'Masuk / daftar'}
                    </PrimaryButton>
                  </a>
                  <a href={`/${locale}/professionals/apply`}>
                    <SecondaryButton className="w-full" type="button">
                      {en ? 'Open professional path' : 'Buka jalur profesional'}
                    </SecondaryButton>
                  </a>
                </div>
              </MarketplaceSurfaceCard>
            ) : (
              <div
                className="rounded-[28px] p-5 text-white"
                style={{
                  background: 'var(--ui-hero-gradient)',
                  boxShadow: 'var(--ui-shadow-hero)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/92">
                      {en ? 'Customer console' : 'Ruang customer'}
                    </div>
                    <h2 className="mt-4 text-[24px] font-bold leading-tight text-white">
                      {en ? 'Keep family care easy to scan' : 'Pantau kebutuhan keluarga lebih mudah'}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/84">
                      {en
                        ? 'Track active orders, reminders, and support from one calm workspace.'
                        : 'Pantau order aktif, pengingat, dan bantuan dari satu workspace yang lebih tenang dibaca.'}
                    </p>
                  </div>
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-105"
                    href={ordersHref}
                    style={{ color: 'var(--ui-primary)' }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/16 bg-white/12 p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
                      {en ? 'Viewer' : 'Akun aktif'}
                    </p>
                    <p className="mt-2 text-[16px] font-bold leading-snug text-white">
                      {session?.customerProfile?.displayName || (en ? 'Customer account' : 'Akun customer')}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-white/72">{viewerLabel(session, locale)}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/16 bg-white/12 p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
                      {en ? 'Fast lane' : 'Akses cepat'}
                    </p>
                    <div className="mt-2 space-y-2 text-[12px] font-semibold text-white">
                      <p>{en ? 'Orders and payment follow-up' : 'Order dan tindak lanjut pembayaran'}</p>
                      <p>{en ? 'Support and account reminders' : 'Support dan pengingat akun'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/18 bg-white/12 px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/16"
                    href={ordersHref}
                  >
                    {en ? 'Open activity' : 'Buka aktivitas'}
                  </a>
                  <a
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-3 text-[13px] font-semibold transition-colors hover:bg-slate-50"
                    href={supportHref}
                    style={{ color: 'var(--ui-primary)' }}
                  >
                    {en ? 'Open support' : 'Buka support'}
                  </a>
                </div>

                <div className="mt-4 rounded-[20px] bg-white/94 p-4 text-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold"
                        style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
                      >
                        {profileInitial(session)}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900">
                          {session?.customerProfile?.displayName || (en ? 'Customer account' : 'Akun customer')}
                        </h3>
                        <p className="text-[12px] text-gray-500">
                          {en
                            ? 'Open orders, reminders, and support from one place.'
                            : 'Buka order, pengingat, dan support dari satu tempat.'}
                        </p>
                      </div>
                    </div>
                    <a
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700"
                      href={notificationsHref}
                    >
                      <Bell className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
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
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-4">
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
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
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
            <div className="space-y-4">
              {professionals.slice(0, 3).map((professional) => (
                <ProfessionalCard key={professional.id} locale={locale} professional={professional} />
              ))}
            </div>
          </section>

          <MarketplaceSurfaceCard tone="white" className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--ui-primary)] shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold text-gray-900">{presentation.helpTitle}</div>
                <div className="mt-2 text-[13px] leading-6 text-gray-500">{presentation.helpDescription}</div>
                <div className="mt-4">
                  <a href={supportHref}>
                    <SecondaryButton type="button">{en ? 'Open help' : 'Buka bantuan'}</SecondaryButton>
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
