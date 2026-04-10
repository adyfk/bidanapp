'use client';

import type { DirectoryOffering } from '@marketplace/marketplace-core/directory';
import { StatusChipGroup } from '@marketplace/ui';
import { ChevronRight, Clock3, Tag } from 'lucide-react';
import { deliveryModeLabel, formatCurrency } from '../../../../lib/marketplace-copy';
import { DeliveryModeChip, OfferingTypeChip } from '../../../../lib/status-visuals';
import { InitialPortrait } from './portrait';

export function OfferingCard({ locale, offering }: { locale: string; offering: DirectoryOffering }) {
  const modeLabel = deliveryModeLabel(offering.deliveryMode, locale);

  return (
    <a
      className="block cursor-pointer rounded-[28px] border p-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.24)] transition-all hover:shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] active:scale-[0.98]"
      href={`/${locale}/s/${offering.slug}`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 42%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <InitialPortrait label={offering.title} size="small" />
          <div className="min-w-0">
            <div className="text-[16px] font-bold leading-tight break-words text-gray-900 [overflow-wrap:anywhere]">
              {offering.title}
            </div>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ui-primary)' }}>
              {offering.professionalDisplayName}
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 break-words text-[13px] leading-6 text-gray-600 [overflow-wrap:anywhere]">
        {offering.description}
      </p>

      <StatusChipGroup className="mt-4">
        <OfferingTypeChip compact locale={locale} value={offering.offeringType} />
        <DeliveryModeChip compact locale={locale} value={offering.deliveryMode} />
      </StatusChipGroup>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-50 pt-3 text-[13px] font-medium text-gray-600">
        <div className="inline-flex items-center gap-1.5">
          <Clock3 className="h-4 w-4 text-gray-400" />
          <span>{modeLabel}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold text-white">
          <Tag className="h-4 w-4 text-white/60" />
          {formatCurrency(offering.priceAmount, locale, offering.currency)}
        </div>
      </div>
    </a>
  );
}
