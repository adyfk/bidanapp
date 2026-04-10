'use client';

import { MarketplaceEmptyCard, MarketplaceMobileShell } from '@marketplace/ui';
import { isEnglishLocale } from '../../../../lib/marketplace-copy';
import type { ApplyLocaleItem } from '../utils';
import { NotReadyStateCard } from './application-sections';
import { ProfessionalApplyPageHeader } from './page-header';

export function ProfessionalApplyNotReadyState({
  homeHref,
  locale,
  localeItems,
}: {
  homeHref: string;
  locale: string;
  localeItems: ApplyLocaleItem[];
}) {
  return (
    <MarketplaceMobileShell showNav={false}>
      <div
        className="flex h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
        style={{ backgroundColor: 'var(--ui-background)' }}
      >
        <ProfessionalApplyPageHeader homeHref={homeHref} locale={locale} localeItems={localeItems} />

        <div className="space-y-6 px-5 py-6">
          <NotReadyStateCard locale={locale} />
          <MarketplaceEmptyCard
            title={isEnglishLocale(locale) ? 'Form is not ready yet' : 'Form belum siap'}
            description={
              isEnglishLocale(locale)
                ? 'Try opening this screen again shortly.'
                : 'Coba buka layar ini lagi beberapa saat lagi.'
            }
          />
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
