'use client';

import { MarketplaceHeaderIconButton, MarketplaceMobileShell } from '@marketplace/ui/marketplace-lite';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { createLocalizedPath } from '../../../../lib/platform';

export function MarketplaceAuthShell({
  backHref,
  children,
  title,
}: {
  backHref?: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <MarketplaceMobileShell showNav={false}>
      <div
        className="flex h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
        style={{ backgroundColor: 'var(--ui-background)' }}
      >
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
            <div className="w-10">
              {backHref ? (
                <MarketplaceHeaderIconButton href={backHref}>
                  <ChevronLeft className="h-5 w-5" />
                </MarketplaceHeaderIconButton>
              ) : null}
            </div>
            <p className="text-[15px] font-bold text-gray-900">{title}</p>
            <div className="w-10" />
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">{children}</div>
      </div>
    </MarketplaceMobileShell>
  );
}

export function resolveDefaultAuthBackHref(locale: string, isHub?: boolean) {
  return isHub ? undefined : createLocalizedPath(locale);
}
