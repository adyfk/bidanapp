'use client';

import type { AdminOpsOrder } from '@marketplace/marketplace-core';
import { EmptyState, EntityCard, PrimaryButton, SecondaryButton, StatusChipGroup, SurfaceCard } from '@marketplace/ui';
import { OrderStatusChip, PaymentStatusChip } from '../../../lib/status-visuals';
import { formatAdminCurrency } from '../utils';

export function OrdersSection({
  busy,
  onUpdateStatus,
  orders,
}: {
  busy: boolean;
  onUpdateStatus: (orderId: string, status: string, paymentStatus?: string) => Promise<void>;
  orders: AdminOpsOrder[];
}) {
  return (
    <SurfaceCard
      title="Order desk"
      description="Pantau status pesanan, pembayaran, dan tindak lanjut customer dari satu desk."
    >
      {orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <EntityCard
              key={order.id}
              badge={
                <StatusChipGroup>
                  <OrderStatusChip compact value={order.status} />
                  <PaymentStatusChip compact value={order.paymentStatus} />
                </StatusChipGroup>
              }
              description={`Customer: ${order.customerUserId} • Professional: ${order.professionalUserId}`}
              subtitle={order.orderType.replaceAll('_', ' ')}
              title={order.offeringTitle}
              meta={
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                  Nominal
                  <div className="mt-1 text-[14px] font-bold text-slate-900">
                    {formatAdminCurrency(order.totalAmount, order.currency)}
                  </div>
                </div>
              }
              actions={
                <>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() => void onUpdateStatus(order.id, 'pending_fulfillment')}
                    type="button"
                  >
                    Fulfill
                  </SecondaryButton>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() =>
                      void onUpdateStatus(order.id, 'completed', order.paymentStatus === 'paid' ? 'paid' : undefined)
                    }
                    type="button"
                  >
                    Complete
                  </SecondaryButton>
                  <PrimaryButton
                    disabled={busy}
                    onClick={() =>
                      void onUpdateStatus(
                        order.id,
                        order.status === 'pending_payment' ? 'pending_fulfillment' : order.status,
                        'paid',
                      )
                    }
                    type="button"
                  >
                    Paid
                  </PrimaryButton>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Belum ada order" description="Pesanan pelanggan akan muncul di antrean ini." />
      )}
    </SurfaceCard>
  );
}
