'use client';

import { BadgeCheck, CalendarClock, FolderKanban, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { compactBadgeClass, insetSurfaceClass, surfaceCardPaddedClass } from '@/components/ui/tokens';
import type {
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalPortalState,
} from '@/lib/use-professional-portal';
import { ChecklistRow, MiniStatCard, SectionHeading } from './ProfessionalDashboardShared';
import type { NextAvailableSchedule, ReadinessItem } from './types';

interface ProfessionalDashboardOverviewTabProps {
  activeCoverageAreaCount: number;
  activeProfessionalLocation: string;
  activeServiceConfigurations: ProfessionalManagedService[];
  featuredServiceConfiguration: ProfessionalManagedService | null;
  getServiceLabel: (serviceId: string) => string;
  nextSchedule: NextAvailableSchedule | null;
  portalState: ProfessionalPortalState;
  publicPortfolioEntries: ProfessionalManagedPortfolioEntry[];
  readinessItems: ReadinessItem[];
}

export const ProfessionalDashboardOverviewTab = ({
  activeCoverageAreaCount,
  activeProfessionalLocation,
  activeServiceConfigurations,
  featuredServiceConfiguration,
  getServiceLabel,
  nextSchedule,
  portalState,
  publicPortfolioEntries,
  readinessItems,
}: ProfessionalDashboardOverviewTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');

  return (
    <div className="grid gap-4">
      <section className={surfaceCardPaddedClass}>
        <SectionHeading
          icon={<BadgeCheck className="h-5 w-5" />}
          title={t('overview.readinessTitle')}
          description={portalState.credentialNumber}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {readinessItems.map((item) => (
            <ChecklistRow key={item.id} title={item.label} value={item.value} />
          ))}
        </div>
      </section>

      <section className={surfaceCardPaddedClass}>
        <SectionHeading
          icon={<Tag className="h-5 w-5" />}
          title={t('overview.featuredServiceTitle')}
          description={
            featuredServiceConfiguration
              ? getServiceLabel(featuredServiceConfiguration.serviceId)
              : t('overview.noFeaturedService')
          }
        />

        {featuredServiceConfiguration ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStatCard label={t('overview.priceLabel')} value={featuredServiceConfiguration.price} />
            <MiniStatCard
              label={t('overview.capacityLabel')}
              value={t('units.weeklyCapacity', { count: featuredServiceConfiguration.weeklyCapacity })}
            />
            <MiniStatCard
              label={t('overview.bookingFlowLabel')}
              value={
                featuredServiceConfiguration.bookingFlow === 'instant'
                  ? professionalT('bookingFlowInstant')
                  : professionalT('bookingFlowRequest')
              }
            />
            <MiniStatCard
              label={t('overview.leadTimeLabel')}
              value={t('units.hoursShort', { count: featuredServiceConfiguration.leadTimeHours })}
            />
          </div>
        ) : (
          <div className={`${insetSurfaceClass} mt-4 p-4`}>
            <p className="text-[13px] leading-relaxed text-slate-500">{t('overview.noServiceHint')}</p>
          </div>
        )}

        <div className={`${insetSurfaceClass} mt-4 p-4`}>
          <SectionHeading
            icon={<CalendarClock className="h-5 w-5" />}
            title={t('overview.nextScheduleTitle')}
            description={nextSchedule ? getServiceLabel(nextSchedule.serviceId) : t('overview.noScheduleTitle')}
          />
          {nextSchedule ? (
            <div className="mt-3 rounded-[18px] border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-[14px] font-bold text-slate-900">
                {nextSchedule.dayLabel} • {nextSchedule.slotLabel}
              </p>
              <p className="mt-2 text-[13px] text-slate-500">
                {nextSchedule.mode === 'home_visit' ? professionalT('modeHomeVisit') : professionalT('modeOnsite')}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{t('overview.noSchedule')}</p>
          )}
        </div>
      </section>

      <div className={surfaceCardPaddedClass}>
        <div className="grid gap-4">
          <div>
            <SectionHeading
              icon={<FolderKanban className="h-5 w-5" />}
              title={t('overview.publicProfileTitle')}
              description={activeProfessionalLocation}
            />
            <p className="mt-4 text-[13px] leading-relaxed text-slate-600">{portalState.publicBio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={compactBadgeClass}>
                {activeServiceConfigurations.length} {t('overview.profileChips.services')}
              </span>
              <span className={compactBadgeClass}>
                {publicPortfolioEntries.length} {t('overview.profileChips.portfolio')}
              </span>
              <span className={compactBadgeClass}>
                {portalState.galleryItems.length} {t('overview.profileChips.gallery')}
              </span>
            </div>
          </div>

          <div className={`${insetSurfaceClass} p-4`}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('services.activeLabel')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeServiceConfigurations.slice(0, 6).map((service) => (
                <span key={service.serviceId} className={compactBadgeClass}>
                  {getServiceLabel(service.serviceId)}
                </span>
              ))}
              {activeCoverageAreaCount > 0 ? (
                <span className={compactBadgeClass}>
                  {activeCoverageAreaCount} {t('metrics.areaUnit')}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
