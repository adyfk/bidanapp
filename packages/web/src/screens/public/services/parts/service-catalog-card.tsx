'use client';

import type { DirectoryOffering } from '@marketplace/marketplace-core';
import { StatusPill } from '@marketplace/ui';
import { ChevronRight, Clock, Tag } from 'lucide-react';
import { deliveryModeLabel, formatCurrency, offeringTypeLabel } from '../../../../lib/marketplace-copy';
import { InitialPortrait } from '../../shared/parts/portrait';

export function ServiceCatalogCard({ locale, offering }: { locale: string; offering: DirectoryOffering }) {
  return (
    <a
      className="block cursor-pointer rounded-[28px] border bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF9FC_100%)] p-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.24)] transition-all hover:shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] active:scale-[0.98]"
      href={`/${locale}/s/${offering.slug}`}
      style={{ borderColor: '#f0f1f4' }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 gap-3">
          <InitialPortrait label={offering.title} size="small" />
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-gray-900">{offering.title}</h3>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ui-primary)' }}>
              {offeringTypeLabel(offering.offeringType, locale)}
            </p>
            <p className="mt-2 text-[12px] font-medium text-gray-500">{offering.professionalDisplayName}</p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <p className="line-clamp-2 text-[13px] leading-6 text-gray-600">{offering.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="neutral">{deliveryModeLabel(offering.deliveryMode, locale)}</StatusPill>
        <StatusPill tone="neutral">{offering.professionalDisplayName}</StatusPill>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-gray-50 pt-3 text-[13px] font-medium text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{deliveryModeLabel(offering.deliveryMode, locale)}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold text-white">
          <Tag className="h-4 w-4 text-white/60" />
          {formatCurrency(offering.priceAmount, locale, offering.currency)}
        </div>
      </div>
    </a>
  );
}
