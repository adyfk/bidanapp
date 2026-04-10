'use client';

import type { DirectoryProfessional, ViewerSession } from '@marketplace/marketplace-core';
import type { ServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceEmptyCard,
  MarketplaceFeaturePill,
  MarketplaceFilterChip,
  MarketplaceMobileShell,
  MarketplaceSearchField,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
} from '@marketplace/ui/marketplace-lite';
import { Bell, MapPin, Search, SlidersHorizontal, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import { currentCity } from '../shared/parts/portrait';
import { ProfessionalCard } from '../shared/parts/professional-card';

export function MarketplaceExploreView({
  currentPath,
  locale,
  notificationsHref,
  platform,
  professionals,
  profileHref,
  session,
}: {
  currentPath: string;
  locale: string;
  notificationsHref: string;
  platform: ServicePlatformConfig;
  professionals: DirectoryProfessional[];
  profileHref: string;
  session?: ViewerSession | null;
}) {
  void currentPath;
  const en = isEnglishLocale(locale);
  const [query, setQuery] = useState('');
  const [activeCity, setActiveCity] = useState('all');
  const presentation = platform.presentation;
  const cities = useMemo(
    () => ['all', ...new Set(professionals.map((item) => item.city).filter(Boolean))],
    [professionals],
  );

  const filtered = useMemo(() => {
    return professionals.filter((item) => {
      const matchesCity = activeCity === 'all' ? true : item.city === activeCity;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0
          ? true
          : item.displayName.toLowerCase().includes(q) ||
            item.city.toLowerCase().includes(q) ||
            (item.coverageAreas ?? []).join(' ').toLowerCase().includes(q);
      return matchesCity && matchesQuery;
    });
  }, [activeCity, professionals, query]);

  return (
    <MarketplaceMobileShell activeNavId="explore" navItems={createPrimaryMarketplaceNav(platform, locale)}>
      <div className="flex min-h-full flex-col bg-[var(--ui-background)] pb-24">
        <div className="sticky top-0 z-20 px-6 pb-4 pt-14" style={{ backgroundColor: 'var(--ui-background)' }}>
          <h1 className="mb-1 text-[22px] font-bold text-gray-900">{presentation.exploreTitle}</h1>
          <button
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            type="button"
            style={{ color: 'var(--ui-text-muted)' }}
          >
            <MapPin className="h-4 w-4" style={{ color: 'var(--ui-primary)' }} />
            <span>{currentCity(session, professionals, locale)}</span>
          </button>
        </div>

        <div className="space-y-6 px-6 pb-10">
          <div className="flex gap-3">
            <div className="flex-1">
              <MarketplaceSearchField
                leading={<Search className="h-5 w-5" />}
                onChange={setQuery}
                placeholder={en ? 'Search professional or city' : 'Cari profesional atau kota'}
                value={query}
              />
            </div>
            <button
              className="relative flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-sm"
              style={{ borderColor: 'var(--ui-border)' }}
              type="button"
            >
              <SlidersHorizontal className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <MarketplaceSurfaceCard tone="blush" className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] text-slate-500">{en ? 'Current search area' : 'Area pencarian saat ini'}</p>
                <p className="mt-2 text-[15px] font-bold text-slate-900">
                  {currentCity(session, professionals, locale)}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">{presentation.exploreDescription}</p>
              </div>
              <MarketplaceFeaturePill tone="soft">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {cities.length - 1 || 1} {en ? 'areas' : 'area'}
                </span>
              </MarketplaceFeaturePill>
            </div>
          </MarketplaceSurfaceCard>

          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1">
            {platform.presentation.categories.map((category) => (
              <MarketplaceFilterChip
                active={query === (category.query ?? category.label)}
                key={category.id}
                onClick={() => setQuery(category.query ?? category.label)}
              >
                {category.label}
              </MarketplaceFilterChip>
            ))}
          </div>

          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
            {cities.map((city) => (
              <MarketplaceFilterChip active={activeCity === city} key={city} onClick={() => setActiveCity(city)}>
                {city === 'all' ? (en ? 'All areas' : 'Semua area') : city}
              </MarketplaceFilterChip>
            ))}
          </div>

          <MarketplaceSectionHeader
            title={en ? `${filtered.length} professionals found` : `${filtered.length} profesional ditemukan`}
            description={
              en
                ? 'Browse nearby professionals, then open the profile that feels right.'
                : 'Buka profesional terdekat, lalu lanjut ke profil yang terasa paling cocok.'
            }
            action={
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-sm"
                href={session?.isAuthenticated ? notificationsHref : profileHref}
              >
                {session?.isAuthenticated ? <Bell className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              </a>
            }
          />

          {filtered.length ? (
            <div className="space-y-4">
              {filtered.map((professional) => (
                <ProfessionalCard key={professional.id} locale={locale} professional={professional} />
              ))}
            </div>
          ) : (
            <MarketplaceEmptyCard
              description={en ? 'Try another keyword or area.' : 'Coba kata kunci atau area yang lain.'}
              title={en ? 'No professionals found' : 'Belum ada profesional yang cocok'}
            />
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
