'use client';

import { MarketplaceSurfaceCard } from '@marketplace/ui/marketplace-lite';
import { PrimaryButton } from '@marketplace/ui/primitives';
import type { ReactNode } from 'react';

export function CustomerAccessLock({
  actionLabel = 'Masuk',
  authHref,
  description,
  icon,
  title,
}: {
  actionLabel?: string;
  authHref: string;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <MarketplaceSurfaceCard tone="white" className="p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f7] text-[var(--ui-primary)]">
        {icon}
      </div>
      <div className="text-[18px] font-bold text-gray-900">{title}</div>
      <div className="mt-2 text-[14px] leading-relaxed text-gray-500">{description}</div>
      <div className="mt-5">
        <a href={authHref}>
          <PrimaryButton className="w-full" type="button">
            {actionLabel}
          </PrimaryButton>
        </a>
      </div>
    </MarketplaceSurfaceCard>
  );
}
