'use client';

import type { DirectoryProfessional } from '@marketplace/marketplace-core';
import { isEnglishLocale } from '../../../../lib/marketplace-copy';
import { firstApplyLetter, formatApplyCurrency } from '../utils';

export function PreviewAvatar({ label }: { label: string }) {
  return (
    <div
      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-white text-[16px] font-bold shadow-sm"
      style={{
        background: 'linear-gradient(180deg, var(--ui-surface-muted) 0%, #ffffff 100%)',
        color: 'var(--ui-primary)',
      }}
    >
      {firstApplyLetter(label)}
    </div>
  );
}

export function PreviewProfessionalCard({
  active,
  locale,
  onClick,
  professional,
}: {
  active: boolean;
  locale: string;
  onClick: () => void;
  professional: DirectoryProfessional;
}) {
  const coverageLabel =
    professional.coverageAreas?.[0] ||
    (isEnglishLocale(locale)
      ? 'Trusted professional for modern family care'
      : 'Profesional tepercaya untuk kebutuhan keluarga modern');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition-all ${
        active ? 'shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
      }`}
      style={
        active
          ? {
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 60%, white) 100%)',
              borderColor: 'var(--ui-border-strong)',
            }
          : undefined
      }
    >
      <PreviewAvatar label={professional.displayName} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold break-words text-gray-900 [overflow-wrap:anywhere]">
          {professional.displayName}
        </p>
        <p className="mt-1 break-words text-[12px] text-gray-500 [overflow-wrap:anywhere]">{coverageLabel}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600">
            {professional.city || (isEnglishLocale(locale) ? 'Selected area' : 'Area pilihan')}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600">
            {formatApplyCurrency(professional.startingPrice, locale)}
          </span>
        </div>
      </div>
    </button>
  );
}
