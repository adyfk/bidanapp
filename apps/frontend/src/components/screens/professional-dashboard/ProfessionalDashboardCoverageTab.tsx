'use client';

import { MapPin, Navigation, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  accentSoftPillClass,
  blushSubtlePanelClass,
  darkPrimaryButtonClass,
  neutralSoftPillClass,
  softMetricTileClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import type { ProfessionalManagedService } from '@/lib/use-professional-portal';
import type { OfflineServiceDeliveryMode, ProfessionalAvailabilityRules, ServiceDeliveryMode } from '@/types/catalog';
import { buildManagedServicesAvailabilitySummary } from './helpers';
import { DashboardHeroPanel, SectionHeading, ServiceModeBadge, SwitchStatusRow } from './ProfessionalDashboardShared';
import type { CoverageDraft } from './types';

interface ProfessionalDashboardCoverageTabProps {
  availabilityRulesByMode?: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>>;
  coverageDraft: CoverageDraft;
  getAreaLabel: (areaId: string) => string;
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  onEditCoverage: () => void;
  serviceConfigurations: ProfessionalManagedService[];
}

const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <div className={softMetricTileClass}>
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-[15px] font-bold leading-snug text-slate-900">{value}</p>
  </div>
);

const CoverageGroup = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className={`${softWhitePanelClass} px-4 py-4`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <div className="mt-3">{children}</div>
  </div>
);

export const ProfessionalDashboardCoverageTab = ({
  availabilityRulesByMode,
  coverageDraft,
  getAreaLabel,
  getModeLabel,
  onEditCoverage,
  serviceConfigurations,
}: ProfessionalDashboardCoverageTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const practiceTitle = coverageDraft.practiceLabel || coverageDraft.city || t('coverage.fields.practiceLabel');
  const practiceAddress = coverageDraft.practiceAddress || t('coverage.emptyPracticeAddress');
  const publicBio = coverageDraft.publicBio || t('coverage.emptyPublicBio');
  const availabilitySummary = buildManagedServicesAvailabilitySummary(serviceConfigurations, availabilityRulesByMode);

  return (
    <section className="space-y-5">
      <DashboardHeroPanel
        icon={<MapPin className="h-5 w-5" />}
        eyebrow={t('coverage.title')}
        title={practiceTitle}
        description={practiceAddress}
        action={
          <button type="button" onClick={onEditCoverage} className={`${darkPrimaryButtonClass} w-full`}>
            {t('coverage.editButton')}
          </button>
        }
      >
        <div className={`${blushSubtlePanelClass} px-4 py-4`}>
          <div className="flex flex-wrap gap-2">
            <span className={accentSoftPillClass}>{t('coverage.city')}</span>
            <span className={neutralSoftPillClass}>
              {coverageDraft.coverageAreaIds.length} {t('coverage.areaCountLabel')}
            </span>
          </div>
          <h3 className="mt-4 text-[20px] font-bold leading-tight text-slate-900">{practiceTitle}</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{publicBio}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SummaryTile label={t('coverage.fields.city')} value={coverageDraft.city || '-'} />
            <SummaryTile label={t('coverage.fields.responseTime')} value={coverageDraft.responseTimeGoal || '-'} />
            <SummaryTile
              label={t('coverage.fields.radius')}
              value={t('units.kilometers', { count: coverageDraft.homeVisitRadiusKm || '0' })}
            />
            <SummaryTile
              label={t('coverage.fields.areaSelection')}
              value={String(coverageDraft.coverageAreaIds.length)}
            />
          </div>
        </div>
      </DashboardHeroPanel>

      <div className={`${softWhitePanelClass} space-y-4 p-4`}>
        <SectionHeading
          icon={<MapPin className="h-5 w-5" />}
          title={t('coverage.scopeTitle')}
          description={t('coverage.scopeDescription')}
        />

        <CoverageGroup label={t('coverage.modeCoverageLabel')}>
          {availabilitySummary.activeModes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availabilitySummary.activeModes.map((mode) => (
                <ServiceModeBadge key={mode} isActive isDefault={false} label={getModeLabel(mode)} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-slate-500">{t('coverage.emptyModeSelection')}</p>
          )}
        </CoverageGroup>

        <CoverageGroup label={t('coverage.fields.areaSelection')}>
          {coverageDraft.coverageAreaIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {coverageDraft.coverageAreaIds.map((areaId) => (
                <span key={areaId} className={neutralSoftPillClass}>
                  {getAreaLabel(areaId)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-slate-500">{t('coverage.emptyAreaSelection')}</p>
          )}
        </CoverageGroup>
      </div>

      <div className="space-y-4">
        <div className={`${softWhitePanelClass} space-y-4 p-4`}>
          <SectionHeading
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t('coverage.operationsTitle')}
            description={t('coverage.operationsDescription')}
          />
          <div className="grid gap-3">
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

        <div className={`${softWhitePanelClass} space-y-4 p-4`}>
          <SectionHeading icon={<Navigation className="h-5 w-5" />} title={t('coverage.coordinates')} />
          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label={t('coverage.fields.latitude')} value={coverageDraft.latitude} />
            <SummaryTile label={t('coverage.fields.longitude')} value={coverageDraft.longitude} />
          </div>
        </div>
      </div>
    </section>
  );
};
