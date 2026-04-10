'use client';

import type { DirectoryOffering } from '@marketplace/marketplace-core/directory';
import { StatusPill } from '@marketplace/ui/primitives';
import { deliveryModeLabel, formatCurrency } from '../../../../lib/marketplace-copy';
import { InitialPortrait } from '../../shared/parts/portrait';

export function HomeServiceTile({ locale, offering }: { locale: string; offering: DirectoryOffering }) {
  return (
    <a
      className="relative block min-w-[208px] overflow-hidden rounded-[24px] border bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF9FC_100%)] p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)] transition-all hover:shadow-[0_18px_42px_-30px_rgba(15,23,42,0.24)] active:scale-[0.98]"
      href={`/${locale}/s/${offering.slug}`}
      style={{ borderColor: '#f0f1f4' }}
    >
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.08] transition-transform duration-500"
        style={{ backgroundColor: 'var(--ui-primary)' }}
      />
      <div className="relative z-10 flex h-full flex-col">
        <InitialPortrait label={offering.title} size="small" />
        <div className="mt-4 text-[16px] font-bold text-gray-900">{offering.title}</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ui-primary)' }}>
          {offering.professionalDisplayName}
        </div>
        <div className="mt-3 line-clamp-2 text-[13px] leading-5 text-gray-500">{offering.description}</div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <StatusPill tone="neutral">{deliveryModeLabel(offering.deliveryMode, locale)}</StatusPill>
          <div className="text-[13px] font-bold text-gray-900">
            {formatCurrency(offering.priceAmount, locale, offering.currency)}
          </div>
        </div>
      </div>
    </a>
  );
}
