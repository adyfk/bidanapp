'use client';

import { MarketplaceHeaderIconButton, MarketplaceLocalePills } from '@marketplace/ui';
import { isEnglishLocale } from '../../../../lib/marketplace-copy';
import type { ApplyLocaleItem } from '../utils';

export function ProfessionalApplyPageHeader({
  homeHref,
  locale,
  localeItems,
}: {
  homeHref: string;
  locale: string;
  localeItems: ApplyLocaleItem[];
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-rose-100/80 bg-white/92 px-4 pb-4 pt-14 backdrop-blur-sm">
      <MarketplaceHeaderIconButton href={homeHref}>
        <span aria-hidden="true">‹</span>
      </MarketplaceHeaderIconButton>
      <p className="text-[15px] font-bold text-gray-900">
        {isEnglishLocale(locale) ? 'Professional access' : 'Akses profesional'}
      </p>
      <MarketplaceLocalePills activeValue={locale} items={localeItems} />
    </div>
  );
}
