'use client';

import { useTranslations } from 'next-intl';
import { surfaceCardPaddedClass } from '@/components/ui/tokens';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { deliveryModes } from './helpers';
import { MiniStatCard, ServiceMetaChip, ServiceModeBadge, SwitchStatusRow } from './ProfessionalDashboardShared';
import type { CoverageDraft } from './types';

interface ProfessionalDashboardCoverageTabProps {
  coverageDraft: CoverageDraft;
  getAreaLabel: (areaId: string) => string;
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  onEditCoverage: () => void;
}

export const ProfessionalDashboardCoverageTab = ({
  coverageDraft,
  getAreaLabel,
  getModeLabel,
  onEditCoverage,
}: ProfessionalDashboardCoverageTabProps) => {
  const t = useTranslations('ProfessionalPortal');

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard
          label={t('coverage.radiusLabel')}
          value={t('units.kilometers', { count: coverageDraft.homeVisitRadiusKm })}
        />
        <MiniStatCard label={t('coverage.areaCountLabel')} value={String(coverageDraft.coverageAreaIds.length)} />
        <MiniStatCard label={t('coverage.fields.practiceModes')} value={String(coverageDraft.practiceModes.length)} />
        <MiniStatCard
          label={t('coverage.fields.capacity')}
          value={t('units.monthlyCapacity', { count: coverageDraft.monthlyCapacity })}
        />
      </div>

      <div className="grid gap-4">
        <div className={surfaceCardPaddedClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('coverage.title')}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{coverageDraft.practiceAddress}</p>
            </div>
            <button
              type="button"
              onClick={onEditCoverage}
              className="rounded-full bg-slate-900 px-4 py-2 text-[13px] font-bold text-white"
            >
              {t('coverage.editButton')}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ServiceMetaChip label={t('coverage.fields.city')} value={coverageDraft.city} />
            <ServiceMetaChip label={t('coverage.fields.responseTime')} value={coverageDraft.responseTimeGoal} />
            <ServiceMetaChip
              label={t('coverage.fields.capacity')}
              value={t('units.monthlyCapacity', { count: coverageDraft.monthlyCapacity })}
            />
            <ServiceMetaChip
              label={t('coverage.fields.radius')}
              value={t('units.kilometers', { count: coverageDraft.homeVisitRadiusKm })}
            />
          </div>

          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('coverage.fields.practiceLabel')}
            </p>
            <p className="mt-2 text-[15px] font-bold text-slate-900">{coverageDraft.practiceLabel}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{coverageDraft.publicBio}</p>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('coverage.fields.practiceModes')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {deliveryModes.map((mode) => (
                <ServiceModeBadge
                  key={mode}
                  isActive={coverageDraft.practiceModes.includes(mode)}
                  isDefault={false}
                  label={getModeLabel(mode)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('coverage.fields.areaSelection')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {coverageDraft.coverageAreaIds.map((areaId) => (
                <span
                  key={areaId}
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700"
                >
                  {getAreaLabel(areaId)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={surfaceCardPaddedClass}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('coverage.switches.accepting')}
            </p>
            <div className="mt-4 grid gap-3">
              <SwitchStatusRow
                checked={coverageDraft.acceptingNewClients}
                description={t('coverage.switches.acceptingDescription')}
                label={t('coverage.switches.accepting')}
                offLabel={t('coverage.switches.offLabel')}
                onLabel={t('coverage.switches.onLabel')}
              />
              <SwitchStatusRow
                checked={coverageDraft.autoApproveInstantBookings}
                description={t('coverage.switches.instantDescription')}
                label={t('coverage.switches.instant')}
                offLabel={t('coverage.switches.offLabel')}
                onLabel={t('coverage.switches.onLabel')}
              />
            </div>
          </div>

          <div className={surfaceCardPaddedClass}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('coverage.coordinates')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ServiceMetaChip label={t('coverage.fields.latitude')} value={coverageDraft.latitude} />
              <ServiceMetaChip label={t('coverage.fields.longitude')} value={coverageDraft.longitude} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
