'use client';

import type { ProfessionalWorkspaceSnapshot } from '@marketplace/marketplace-core';
import { EntityCard } from '@marketplace/ui/patterns';
import { EmptyState, StatusChipGroup } from '@marketplace/ui/primitives';
import { OrderStatusChip, PaymentStatusChip } from '../../../../lib/status-visuals';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import { formatWorkspaceCurrency } from '../utils';

export function OrdersSection({ snapshot }: { snapshot: ProfessionalWorkspaceSnapshot }) {
  return (
    <WorkspaceSurfaceCard
      title="Permintaan pelanggan"
      description="Daftar order dipadatkan supaya nominal, status, dan konteks layanan tetap mudah dibaca meski judul atau notes panjang."
    >
      {(snapshot.recentOrders ?? []).length ? (
        <div className="space-y-4">
          {(snapshot.recentOrders ?? []).map((order) => (
            <EntityCard
              key={order.id}
              badge={
                <StatusChipGroup>
                  <OrderStatusChip compact value={order.status} />
                  <PaymentStatusChip compact value={order.paymentStatus} />
                </StatusChipGroup>
              }
              description={order.orderType.replaceAll('_', ' ')}
              meta={
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                    Nominal
                    <div className="mt-1 text-[14px] font-bold text-slate-900">
                      {formatWorkspaceCurrency(order.totalAmount, order.currency)}
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                    Order
                    <div className="mt-1 text-[14px] font-bold text-slate-900">{order.id}</div>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-500 sm:col-span-2">
                    Ringkasan status
                    <StatusChipGroup className="mt-2">
                      <OrderStatusChip compact value={order.status} />
                      <PaymentStatusChip compact value={order.paymentStatus} />
                    </StatusChipGroup>
                  </div>
                </div>
              }
              title={order.offeringTitle}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada order"
          description="Order aktif akan muncul di sini setelah customer membuat transaksi."
        />
      )}
    </WorkspaceSurfaceCard>
  );
}
