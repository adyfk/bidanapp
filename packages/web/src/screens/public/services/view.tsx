'use client';

import type { DirectoryOffering } from '@marketplace/marketplace-core';
import type { ServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceEmptyCard,
  MarketplaceFilterChip,
  MarketplaceHeaderIconButton,
  MarketplaceMobileShell,
  MarketplaceSearchField,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
} from '@marketplace/ui';
import { ChevronLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { isEnglishLocale, offeringTypeLabel } from '../../../lib/marketplace-copy';
import { ServiceCatalogCard } from './parts/service-catalog-card';

export function MarketplaceServicesView({
  locale,
  offerings,
  platform,
}: {
  locale: string;
  offerings: DirectoryOffering[];
  platform: ServicePlatformConfig;
}) {
  const en = isEnglishLocale(locale);
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const categories = platform.presentation.categories;
  const activeCategory = categories.find((item) => item.id === activeCategoryId) ?? null;

  const filtered = useMemo(() => {
    return offerings.filter((item) => {
      const matchesCategory = !activeCategory
        ? true
        : [item.title, item.description, item.professionalDisplayName]
            .join(' ')
            .toLowerCase()
            .includes((activeCategory.query ?? activeCategory.label).toLowerCase());
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0
          ? true
          : item.title.toLowerCase().includes(q) ||
            item.professionalDisplayName.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, offerings, query]);

  return (
    <MarketplaceMobileShell activeNavId="services" navItems={createPrimaryMarketplaceNav(platform, locale)}>
      <div className="flex min-h-full flex-col bg-[#fff8fb] pb-24">
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 pb-4 pt-14 shadow-sm">
          <MarketplaceHeaderIconButton href={`/${locale}/home`}>
            <ChevronLeft className="h-5 w-5" />
          </MarketplaceHeaderIconButton>
          <h1 className="text-[16px] font-bold tracking-wide text-gray-900">{en ? 'Services' : 'Layanan'}</h1>
          <div className="w-10" />
        </div>

        <div className="space-y-7 px-6 py-6">
          <MarketplaceSearchField
            leading={<Search className="h-5 w-5" />}
            onChange={setQuery}
            placeholder={en ? 'Search service or topic' : 'Cari layanan atau topik'}
            value={query}
          />

          <MarketplaceSurfaceCard tone="blush" className="p-5">
            <p className="text-[12px] text-slate-500">{platform.presentation.servicesTitle}</p>
            <p className="mt-2 text-[15px] font-bold text-slate-900">{platform.presentation.servicesTitle}</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">{platform.presentation.servicesDescription}</p>
          </MarketplaceSurfaceCard>

          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
            <MarketplaceFilterChip active={activeCategoryId === 'all'} onClick={() => setActiveCategoryId('all')}>
              {en ? 'All services' : 'Semua layanan'}
            </MarketplaceFilterChip>
            {categories.map((category) => (
              <MarketplaceFilterChip
                active={activeCategoryId === category.id}
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.label}
              </MarketplaceFilterChip>
            ))}
          </div>

          <div>
            <MarketplaceSectionHeader
              title={en ? `${filtered.length} services ready to browse` : `${filtered.length} layanan siap dijelajahi`}
              description={
                en
                  ? 'Choose a service, review the professional, then continue to booking.'
                  : 'Pilih layanan, lihat profesional yang tersedia, lalu lanjut booking.'
              }
            />

            {filtered.length ? (
              <div className="space-y-4">
                {filtered.map((offering) => (
                  <ServiceCatalogCard key={offering.id} locale={locale} offering={offering} />
                ))}
              </div>
            ) : (
              <MarketplaceEmptyCard
                description={
                  en ? 'Try another keyword or service mode.' : 'Coba kata kunci atau mode layanan yang lain.'
                }
                title={en ? 'No services found' : 'Belum ada layanan yang cocok'}
              />
            )}
          </div>
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
