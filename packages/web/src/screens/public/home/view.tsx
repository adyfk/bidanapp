'use client';

import type { DirectoryOffering, DirectoryProfessional, ViewerSession } from '@marketplace/marketplace-core';
import type { ServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceCategoryTile,
  MarketplaceMobileShell,
  MarketplaceSearchField,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
  PrimaryButton,
  SecondaryButton,
} from '@marketplace/ui';
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
      <div className="flex min-h-full flex-col bg-[#fff8fb] pb-24">
        <div
          className="sticky top-0 z-20 px-6 pb-6 pt-14 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,248,251,0.96)' }}
        >
          <div className="flex items-center justify-between">
            <a
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 shadow-sm"
              href={session?.isAuthenticated ? profileHref : loginHref}
              style={{ backgroundColor: '#f1f5f9', borderColor: '#ffffff', color: 'var(--ui-primary)' }}
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
              className="relative flex h-11 w-11 items-center justify-center rounded-full shadow-sm"
              href={notificationsHref}
              style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
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
                  style={{ backgroundColor: '#fff1f7', color: 'var(--ui-primary)' }}
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
                className="rounded-[28px] p-5 text-white shadow-[0_10px_30px_rgba(233,30,140,0.25)]"
                style={{
                  background:
                    'linear-gradient(135deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-secondary) 70%, #7c1d53) 100%)',
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[13px] font-medium backdrop-blur-sm">
                      {en ? 'Customer activity' : 'Aktivitas customer'}
                    </div>
                    <div className="text-[13px] font-medium text-white/82">{viewerLabel(session, locale)}</div>
                  </div>
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-105"
                    href={ordersHref}
                    style={{ color: 'var(--ui-primary)' }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="rounded-[20px] bg-white p-3 text-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f7] text-[14px] font-bold"
                        style={{ color: 'var(--ui-primary)' }}
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

          <MarketplaceSurfaceCard tone="blush" className="p-6">
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
