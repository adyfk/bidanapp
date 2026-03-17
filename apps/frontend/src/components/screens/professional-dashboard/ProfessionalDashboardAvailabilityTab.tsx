'use client';

import { CalendarDays, Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  accentPrimaryButtonClass,
  neutralSoftPillClass,
  softMetricTileClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import {
  countDateOverrides,
  countEnabledWeeklyHours,
  DEFAULT_AVAILABILITY_MINIMUM_NOTICE_HOURS,
} from '@/lib/availability-rules';
import type { ProfessionalManagedService } from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { buildManagedServicesAvailabilitySummary, offlineDeliveryModes } from './helpers';
import { DashboardHeroPanel, SectionHeading } from './ProfessionalDashboardShared';
import type { AvailabilityDraft } from './types';

interface ProfessionalDashboardAvailabilityTabProps {
  availabilityDraft: AvailabilityDraft;
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  onEditAvailability: () => void;
  serviceConfigurations: ProfessionalManagedService[];
}

const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <div className={softMetricTileClass}>
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-[15px] font-bold leading-snug text-slate-900">{value}</p>
  </div>
);

export const ProfessionalDashboardAvailabilityTab = ({
  availabilityDraft,
  getModeLabel,
  onEditAvailability,
  serviceConfigurations,
}: ProfessionalDashboardAvailabilityTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const availabilitySummary = buildManagedServicesAvailabilitySummary(
    serviceConfigurations,
    availabilityDraft.availabilityRulesByMode,
  );

  return (
    <section className="space-y-4">
      <DashboardHeroPanel
        icon={<CalendarDays className="h-5 w-5" />}
        eyebrow={t('availability.title')}
        title={t('availability.heroTitle')}
        description={t('availability.heroDescription')}
        action={
          <button type="button" onClick={onEditAvailability} className={`${accentPrimaryButtonClass} w-full`}>
            {t('availability.editButton')}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile
            label={t('availability.metrics.activeServices')}
            value={String(availabilitySummary.activeServiceCount)}
          />
          <SummaryTile
            label={t('availability.metrics.activeModes')}
            value={String(availabilitySummary.activeModes.length)}
          />
          <SummaryTile
            label={t('availability.metrics.days')}
            value={String(availabilitySummary.totalBookableDayCount)}
          />
          <SummaryTile
            label={t('availability.metrics.notice')}
            value={availabilitySummary.minimumNoticeLabel || t('availability.noticeFallback')}
          />
        </div>
      </DashboardHeroPanel>

      <div className={`${softWhitePanelClass} space-y-4 p-4`}>
        <SectionHeading
          icon={<Clock3 className="h-5 w-5" />}
          title={t('availability.modeSectionTitle')}
          description={t('availability.modeSectionDescription')}
        />

        <div className="grid gap-3">
          {offlineDeliveryModes.map((mode) => {
            const ruleSet = availabilityDraft.availabilityRulesByMode?.[mode];
            const dayCount = countEnabledWeeklyHours(ruleSet);
            const overrideCount = countDateOverrides(ruleSet);
            const enabledWeekdays = (ruleSet?.weeklyHours || []).filter((window) => window.isEnabled);

            return (
              <div key={mode} className={`${softWhitePanelClass} px-4 py-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-slate-900">{getModeLabel(mode)}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      {dayCount > 0
                        ? t('availability.modeSummaryValue', { days: dayCount, slots: overrideCount })
                        : t('availability.modeSummaryEmpty')}
                    </p>
                  </div>
                  <span className={neutralSoftPillClass}>
                    {dayCount > 0 ? t('availability.readyBadge') : t('availability.emptyBadge')}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <SummaryTile
                    label={t('availability.minimumNoticeTitle')}
                    value={t('availability.noticeValue', {
                      value: ruleSet?.minimumNoticeHours || DEFAULT_AVAILABILITY_MINIMUM_NOTICE_HOURS,
                    })}
                  />
                  <SummaryTile
                    label={t('availability.summaryOverrides')}
                    value={
                      overrideCount > 0
                        ? t('availability.specialDayCount', { count: overrideCount })
                        : t('availability.noSpecialDays')
                    }
                  />
                </div>

                {enabledWeekdays.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enabledWeekdays.slice(0, 4).map((window) => (
                      <span key={window.id} className={neutralSoftPillClass}>
                        {t(`availability.weekdays.${window.weekday}`)} • {window.startTime}-{window.endTime}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
