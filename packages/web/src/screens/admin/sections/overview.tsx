'use client';

import type { AdminOverview, AdminStudioSnapshot } from '@marketplace/marketplace-core';
import { InfoTile, SurfaceCard } from '@marketplace/ui';
import { formatAdminCurrency } from '../utils';

export function OverviewSection({ overview, studio }: { overview: AdminOverview; studio: AdminStudioSnapshot }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <InfoTile label="Customer" value={String(overview.totalCustomers)} />
        <InfoTile label="Profesional" value={String(overview.totalProfessionals)} />
        <InfoTile label="Order aktif" value={String(overview.activeOrders)} />
        <InfoTile label="Menunggu review" value={String(overview.pendingApplications)} />
        <InfoTile label="Refund tertunda" value={String(overview.pendingRefunds)} />
        <InfoTile label="Payout tertunda" value={String(overview.pendingPayouts)} />
        <InfoTile label="Support aktif" value={String(overview.openSupportTickets)} />
        <InfoTile label="Order lunas" value={String(studio.paidOrders)} />
      </div>
      <SurfaceCard
        title="Snapshot keuangan"
        description="Ringkasan cepat untuk memantau pemasukan, refund, payout, dan volume support."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Pendapatan kotor" value={formatAdminCurrency(studio.grossRevenueAmount)} />
          <InfoTile label="Nominal refund" value={formatAdminCurrency(studio.pendingRefundAmount)} />
          <InfoTile label="Nominal payout" value={formatAdminCurrency(studio.pendingPayoutAmount)} />
          <InfoTile label="Tiket support" value={String(studio.supportTickets)} />
        </div>
      </SurfaceCard>
    </>
  );
}
