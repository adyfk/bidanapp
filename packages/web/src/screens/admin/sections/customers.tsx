'use client';

import type { AdminCustomer } from '@marketplace/marketplace-core';
import { EmptyState, EntityCard, StatusPill, SurfaceCard } from '@marketplace/ui';

export function CustomersSection({ customers }: { customers: AdminCustomer[] }) {
  return (
    <SurfaceCard title="Customer" description="Daftar akun customer yang aktif di platform ini.">
      {customers.length ? (
        <div className="space-y-4">
          {customers.map((customer) => (
            <EntityCard
              key={customer.userId}
              badge={<StatusPill tone="neutral">{customer.city || 'Area belum diatur'}</StatusPill>}
              subtitle={`${customer.primaryPhone || '-'} • ${customer.createdAt}`}
              title={customer.displayName || customer.userId}
              meta={
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                  User ID
                  <div className="mt-1 text-[14px] font-bold text-slate-900">{customer.userId}</div>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada customer"
          description="Customer list akan terisi saat viewer global mulai bertransaksi."
        />
      )}
    </SurfaceCard>
  );
}
