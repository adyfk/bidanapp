'use client';

import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function MarketplaceStickyPageHeader({
  title,
  backHref,
  rightSlot,
}: {
  backHref: string;
  rightSlot?: ReactNode;
  title: string;
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
        <a
          className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-rose-50/70"
          href={backHref}
          style={{
            background:
              'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 58%, white) 100%)',
            borderColor: 'var(--ui-border)',
          }}
        >
          <ChevronLeft className="h-5 w-5" style={{ color: 'var(--ui-text-strong)' }} />
        </a>
        <h1 className="text-[16px] font-bold tracking-[0.01em]" style={{ color: 'var(--ui-text-strong)' }}>
          {title}
        </h1>
        {rightSlot || <div className="w-10" />}
      </div>
    </div>
  );
}
