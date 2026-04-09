'use client';

import type { PayoutRecord, ProfessionalApplicationReviewItem } from '@marketplace/marketplace-core';
import {
  EmptyState,
  EntityCard,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  SurfaceCard,
  TextField,
} from '@marketplace/ui';
import type { Dispatch, SetStateAction } from 'react';
import { formatAdminCurrency } from '../utils';

export function PayoutsSection({
  applications,
  busy,
  form,
  onCreate,
  onStatusChange,
  payouts,
  setForm,
}: {
  applications: ProfessionalApplicationReviewItem[];
  busy: boolean;
  form: { amount: string; professionalProfileId: string; provider: string };
  onCreate: () => Promise<void>;
  onStatusChange: (payoutId: string, status: string) => Promise<void>;
  payouts: PayoutRecord[];
  setForm: Dispatch<SetStateAction<{ amount: string; professionalProfileId: string; provider: string }>>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <SurfaceCard title="Buat payout" description="Buat payout untuk profesional yang sudah siap dicairkan.">
        {applications.length ? (
          <div className="mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--ui-text-subtle)' }}>
              Quick pick profesional
            </p>
            <div className="space-y-3">
              {applications
                .filter((application) => application.profileId)
                .slice(0, 4)
                .map((application) => (
                  <EntityCard
                    key={`payout-source-${application.applicationId}`}
                    description={`${application.applicationStatus} • ${application.reviewStatus || 'draft'}`}
                    title={application.displayName || application.userId}
                    actions={
                      <SecondaryButton
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            professionalProfileId: application.profileId || current.professionalProfileId,
                          }))
                        }
                        type="button"
                      >
                        Pakai profil ini
                      </SecondaryButton>
                    }
                  />
                ))}
            </div>
          </div>
        ) : null}
        <div className="grid gap-4">
          <TextField
            label="ID profil profesional"
            value={form.professionalProfileId}
            onChange={(event) => setForm((current) => ({ ...current, professionalProfileId: event.target.value }))}
          />
          <TextField
            label="Kanal payout"
            value={form.provider}
            onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
          />
          <TextField
            label="Nominal"
            inputMode="numeric"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          />
        </div>
        <div className="mt-6">
          <PrimaryButton
            disabled={busy || !form.professionalProfileId.trim()}
            onClick={() => void onCreate()}
            type="button"
          >
            {busy ? 'Menyimpan...' : 'Buat payout'}
          </PrimaryButton>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Antrean payout" description="Semua payout yang sedang diproses akan muncul di sini.">
        {payouts.length ? (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <EntityCard
                key={payout.id}
                badge={<StatusPill tone="neutral">{payout.status}</StatusPill>}
                description={payout.providerReference || 'Belum ada referensi pencairan'}
                subtitle={`${payout.status} • ${formatAdminCurrency(payout.amount, payout.currency)} • ${payout.provider}`}
                title={payout.professionalProfileId}
                actions={
                  <>
                    <SecondaryButton
                      disabled={busy}
                      onClick={() => void onStatusChange(payout.id, 'processing')}
                      type="button"
                    >
                      Processing
                    </SecondaryButton>
                    <PrimaryButton disabled={busy} onClick={() => void onStatusChange(payout.id, 'paid')} type="button">
                      Mark paid
                    </PrimaryButton>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada payout" description="Payout yang dibuat admin akan muncul di sini." />
        )}
      </SurfaceCard>
    </div>
  );
}
