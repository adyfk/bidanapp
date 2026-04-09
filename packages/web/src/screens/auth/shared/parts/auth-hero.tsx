'use client';

import { MarketplaceAccessHero } from '@marketplace/ui';
import type { ReactNode } from 'react';

export function MarketplaceAuthHero({
  badgeLabel,
  benefitItems,
  description,
  statusLabel,
  title,
}: {
  badgeLabel: string;
  benefitItems: Array<{ icon: ReactNode; label: string }>;
  description: string;
  statusLabel: string;
  title: string;
}) {
  return (
    <MarketplaceAccessHero
      badgeLabel={badgeLabel}
      benefits={benefitItems}
      description={description}
      statusLabel={statusLabel}
      title={title}
    />
  );
}
