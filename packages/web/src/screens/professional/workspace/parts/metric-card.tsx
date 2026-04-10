'use client';

import { MarketplaceSurfaceCard } from '@marketplace/ui/marketplace-lite';
import type { ReactNode } from 'react';

export function WorkspaceMetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <MarketplaceSurfaceCard className="min-h-[96px] px-4 py-3.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold leading-5 text-gray-500">
        <span className="text-pink-500">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-[21px] font-bold leading-tight text-gray-900">{value}</p>
    </MarketplaceSurfaceCard>
  );
}
