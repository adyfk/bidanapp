'use client';

import type { AdminOpsOrder, RefundRecord } from '@marketplace/marketplace-core';
import {
  EmptyState,
  EntityCard,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  SurfaceCard,
  TextAreaField,
  TextField,
} from '@marketplace/ui';
import type { Dispatch, SetStateAction } from 'react';
import { formatAdminCurrency } from '../utils';

export function RefundsSection({
  busy,
  form,
  onCreate,
  onStatusChange,
  orders,
  refunds,
  setForm,
}: {
  busy: boolean;
  form: { amount: string; orderId: string; paymentId: string; reason: string };
  onCreate: () => Promise<void>;
  onStatusChange: (refundId: string, status: string) => Promise<void>;
  orders: AdminOpsOrder[];
  refunds: RefundRecord[];
  setForm: Dispatch<SetStateAction<{ amount: string; orderId: string; paymentId: string; reason: string }>>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <SurfaceCard title="Buat refund" description="Buat refund berdasarkan order dan pembayaran yang relevan.">
        {orders.length ? (
          <div className="mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--ui-text-subtle)' }}>
              Quick pick dari demo orders
            </p>
            <div className="space-y-3">
              {orders.slice(0, 4).map((order) => (
                <EntityCard
                  key={`refund-source-${order.id}`}
                  description={`${order.status} • ${order.paymentStatus}`}
                  title={order.offeringTitle}
                  actions={
                    <SecondaryButton
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          amount: String(order.totalAmount),
                          orderId: order.id,
                        }))
                      }
                      type="button"
                    >
                      Pakai
                    </SecondaryButton>
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
        <div className="grid gap-4">
          <TextField
            label="Order ID"
            value={form.orderId}
            onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
          />
          <TextField
            label="Payment ID"
            value={form.paymentId}
            onChange={(event) => setForm((current) => ({ ...current, paymentId: event.target.value }))}
          />
          <TextField
            label="Nominal"
            inputMode="numeric"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          />
          <TextAreaField
            label="Alasan"
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
          />
        </div>
        <div className="mt-6">
          <PrimaryButton disabled={busy || !form.orderId.trim()} onClick={() => void onCreate()} type="button">
            {busy ? 'Simpan...' : 'Buat'}
          </PrimaryButton>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Antrean refund" description="Daftar refund yang sedang diproses.">
        {refunds.length ? (
          <div className="space-y-4">
            {refunds.map((refund) => (
              <EntityCard
                key={refund.id}
                badge={<StatusPill tone="neutral">{refund.status}</StatusPill>}
                description={refund.reason || 'Tanpa alasan khusus.'}
                subtitle={`${refund.status} • ${formatAdminCurrency(refund.amount, refund.currency)} • ${refund.updatedAt}`}
                title={refund.orderId}
                actions={
                  <>
                    <SecondaryButton
                      disabled={busy}
                      onClick={() => void onStatusChange(refund.id, 'approved')}
                      type="button"
                    >
                      Approve
                    </SecondaryButton>
                    <PrimaryButton
                      disabled={busy}
                      onClick={() => void onStatusChange(refund.id, 'processed')}
                      type="button"
                    >
                      Processed
                    </PrimaryButton>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada refund" description="Refund yang dibuat admin akan muncul di sini." />
        )}
      </SurfaceCard>
    </div>
  );
}
