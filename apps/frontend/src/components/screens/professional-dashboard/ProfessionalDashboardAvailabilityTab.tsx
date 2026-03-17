'use client';

import { CalendarDays, Clock3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  accentPrimaryButtonClass,
  blushPanelClass,
  neutralSoftPillClass,
  softMetricTileClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import type { ProfessionalManagedService } from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';
import {
  buildManagedServicesAvailabilitySummary,
  countBookableScheduleDays,
  countBookableScheduleSlots,
  offlineDeliveryModes,
} from './helpers';
import { SectionHeading } from './ProfessionalDashboardShared';
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
    availabilityDraft.availabilityByMode,
  );

  return (
    <section className="space-y-4">
      <div className={`${blushPanelClass} space-y-4 p-4`}>
        <SectionHeading
          icon={<CalendarDays className="h-5 w-5" />}
          eyebrow={t('availability.title')}
          title={t('availability.heroTitle')}
          description={t('availability.heroDescription')}
          action={
            <button type="button" onClick={onEditAvailability} className={accentPrimaryButtonClass}>
              {t('availability.editButton')}
            </button>
          }
        />

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
            label={t('availability.metrics.slots')}
            value={String(availabilitySummary.totalBookableSlotCount)}
          />
        </div>
      </div>

      <div className={`${softWhitePanelClass} space-y-4 p-4`}>
        <SectionHeading
          icon={<Clock3 className="h-5 w-5" />}
          title={t('availability.modeSectionTitle')}
          description={t('availability.modeSectionDescription')}
        />

        <div className="grid gap-3">
          {offlineDeliveryModes.map((mode) => {
            const days = availabilityDraft.availabilityByMode?.[mode] || [];
            const dayCount = countBookableScheduleDays(days);
            const slotCount = countBookableScheduleSlots(days);

            return (
              <div key={mode} className={`${softWhitePanelClass} px-4 py-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-slate-900">{getModeLabel(mode)}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      {dayCount > 0
                        ? t('availability.modeSummaryValue', { days: dayCount, slots: slotCount })
                        : t('availability.modeSummaryEmpty')}
                    </p>
                  </div>
                  <span className={neutralSoftPillClass}>
                    {dayCount > 0 ? t('availability.readyBadge') : t('availability.emptyBadge')}
                  </span>
                </div>

                {days.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {days.slice(0, 4).map((day) => (
                      <span key={day.id} className={neutralSoftPillClass}>
                        {day.label}
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
