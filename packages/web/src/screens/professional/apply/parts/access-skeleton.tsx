'use client';

import { MarketplaceMobileShell } from '@marketplace/ui';
import type { ApplyLocaleItem } from '../utils';
import { ProfessionalApplyPageHeader } from './page-header';

export function ProfessionalAccessSkeleton({
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
          <div className="h-36 rounded-[28px] bg-white shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]" />
          <div className="h-64 rounded-[28px] bg-white shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]" />
          <div className="h-96 rounded-[28px] bg-white shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]" />
          <div className="h-40 rounded-[26px] bg-white shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]" />
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
