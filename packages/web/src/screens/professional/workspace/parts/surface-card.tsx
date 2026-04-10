'use client';

import { MarketplaceSectionHeader, MarketplaceSurfaceCard } from '@marketplace/ui/marketplace-lite';
import type { ReactNode } from 'react';

export function WorkspaceSurfaceCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <MarketplaceSurfaceCard>
      <MarketplaceSectionHeader description={description} title={title} />
      <div className="mt-4">{children}</div>
    </MarketplaceSurfaceCard>
  );
}
