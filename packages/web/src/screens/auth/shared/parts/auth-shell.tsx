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
          className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/92 px-4 pb-4 pt-14 backdrop-blur-sm"
          style={{ borderColor: 'var(--ui-border)' }}
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

        <div className="space-y-6 px-5 py-6">{children}</div>
      </div>
    </MarketplaceMobileShell>
  );
}

export function resolveDefaultAuthBackHref(locale: string, isHub?: boolean) {
  return isHub ? undefined : createLocalizedPath(locale);
}
