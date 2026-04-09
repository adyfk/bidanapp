'use client';

import type { ProfessionalWorkspaceSnapshot } from '@marketplace/marketplace-core';
import { EmptyState, EntityCard, StatusPill } from '@marketplace/ui';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import { formatWorkspaceCurrency } from '../utils';

export function OrdersSection({ snapshot }: { snapshot: ProfessionalWorkspaceSnapshot }) {
  return (
    <WorkspaceSurfaceCard
      title="Permintaan pelanggan"
      description="Semua pesanan terbaru pelanggan tampil di sini agar mudah dipantau dan ditindaklanjuti."
    >
      {(snapshot.recentOrders ?? []).length ? (
        <div className="space-y-4">
          {(snapshot.recentOrders ?? []).map((order) => (
            <EntityCard
              key={order.id}
              badge={<StatusPill tone="neutral">{order.status}</StatusPill>}
              description={`${order.orderType} • ${order.paymentStatus}`}
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
