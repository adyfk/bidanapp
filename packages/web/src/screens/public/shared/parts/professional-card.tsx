'use client';

import type { DirectoryProfessional } from '@marketplace/marketplace-core/directory';
import { StatusPill } from '@marketplace/ui/primitives';
import { ChevronRight, MapPin, Star } from 'lucide-react';
import { formatCurrency, isEnglishLocale } from '../../../../lib/marketplace-copy';
import { compactNumberLabel, InitialPortrait } from './portrait';

export function ProfessionalCard({ locale, professional }: { locale: string; professional: DirectoryProfessional }) {
  const coverageLabel =
    (professional.coverageAreas ?? []).join(' • ') ||
    (isEnglishLocale(locale) ? 'Trusted professional' : 'Profesional tepercaya');

  return (
    <a
      className="block cursor-pointer rounded-[28px] border bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF9FC_100%)] p-4 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.24)] transition-all hover:shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] active:scale-[0.98]"
      href={`/${locale}/p/${professional.slug}`}
      style={{ borderColor: '#f0f1f4' }}
    >
      <div className="flex gap-4">
        <InitialPortrait label={professional.displayName} size="list" />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold leading-tight text-gray-900">{professional.displayName}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-medium">
                <span style={{ color: 'var(--ui-primary)' }}>
                  {professional.city || (isEnglishLocale(locale) ? 'Selected area' : 'Area pilihan')}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">
                  {compactNumberLabel(professional.offeringCount, locale, 'offering', 'offering')}
                </span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-transform hover:scale-105">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-[12px] leading-6 text-gray-500">{coverageLabel}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="accent">
              {compactNumberLabel(professional.offeringCount, locale, 'layanan', 'service')}
            </StatusPill>
            <StatusPill tone="neutral">{formatCurrency(professional.startingPrice, locale)}</StatusPill>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] font-medium text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              {isEnglishLocale(locale) ? 'Trusted professional' : 'Profesional tepercaya'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              {professional.city || (isEnglishLocale(locale) ? 'Selected area' : 'Area pilihan')}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
