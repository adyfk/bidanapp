'use client';

import type { PayoutRecord, ProfessionalApplicationReviewItem } from '@marketplace/marketplace-core';
import {
  EmptyState,
  EntityCard,
  PrimaryButton,
  SecondaryButton,
  StatusChipGroup,
  SurfaceCard,
  TextField,
} from '@marketplace/ui';
import type { Dispatch, SetStateAction } from 'react';
import { PayoutStatusChip, ReviewStatusChip } from '../../../lib/status-visuals';
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
                    badge={
                      <StatusChipGroup>
                        <ReviewStatusChip compact value={application.applicationStatus} />
                        <ReviewStatusChip compact value={application.reviewStatus || 'draft'} />
                      </StatusChipGroup>
                    }
                    description={application.profileId || application.userId}
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
            {busy ? 'Simpan...' : 'Buat'}
          </PrimaryButton>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Antrean payout" description="Semua payout yang sedang diproses akan muncul di sini.">
        {payouts.length ? (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <EntityCard
                key={payout.id}
                badge={<PayoutStatusChip compact value={payout.status} />}
                description={payout.providerReference || 'Belum ada referensi pencairan'}
                subtitle={`${formatAdminCurrency(payout.amount, payout.currency)} • ${payout.provider}`}
                title={payout.professionalProfileId}
                actions={
                  <>
                    <SecondaryButton
                      disabled={busy}
                      onClick={() => void onStatusChange(payout.id, 'processing')}
                      type="button"
                    >
                      Process
                    </SecondaryButton>
                    <PrimaryButton disabled={busy} onClick={() => void onStatusChange(payout.id, 'paid')} type="button">
                      Paid
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
