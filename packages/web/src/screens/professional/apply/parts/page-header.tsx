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
    <div
      className="sticky top-0 z-20 px-4 pb-4 pt-12"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--ui-background) 96%, white) 0%, rgba(255,252,254,0.94) 74%, rgba(255,252,254,0) 100%)',
      }}
    >
      <div
        className="flex items-center justify-between rounded-[26px] border border-white/85 px-3 py-3 shadow-[0_24px_48px_-34px_rgba(88,49,66,0.22)] backdrop-blur-md"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, color-mix(in srgb, var(--ui-surface-muted) 42%, white) 100%)',
          borderColor: 'color-mix(in srgb, var(--ui-border) 92%, white)',
        }}
      >
        <MarketplaceHeaderIconButton href={homeHref}>
          <span aria-hidden="true">‹</span>
        </MarketplaceHeaderIconButton>
        <p className="text-[15px] font-bold text-gray-900">
          {isEnglishLocale(locale) ? 'Professional access' : 'Akses profesional'}
        </p>
        <MarketplaceLocalePills activeValue={locale} items={localeItems} />
      </div>
    </div>
  );
}
