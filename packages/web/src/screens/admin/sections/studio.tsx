'use client';

import type { AdminStudioSnapshot } from '@marketplace/marketplace-core';
import { InfoTile, SurfaceCard } from '@marketplace/ui';
import { formatAdminCurrency } from '../utils';

export function StudioSection({ studio }: { studio: AdminStudioSnapshot }) {
  return (
    <SurfaceCard title="Studio snapshot" description="Ringkasan cepat untuk memeriksa kondisi operasional hari ini.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Pendapatan kotor" value={formatAdminCurrency(studio.grossRevenueAmount)} />
        <InfoTile label="Order lunas" value={String(studio.paidOrders)} />
        <InfoTile label="Refund tertunda" value={formatAdminCurrency(studio.pendingRefundAmount)} />
        <InfoTile label="Payout tertunda" value={formatAdminCurrency(studio.pendingPayoutAmount)} />
      </div>
    </SurfaceCard>
  );
}
