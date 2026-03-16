'use client';

import { useTranslations } from 'next-intl';
import { surfaceCardPaddedClass } from '@/components/ui/tokens';
import type { ProfessionalManagedService } from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { deliveryModes, isServiceModeEnabled } from './helpers';
import { MiniStatCard, ServiceMetaChip, ServiceMetricTile, ServiceModeBadge } from './ProfessionalDashboardShared';

interface ProfessionalDashboardServicesTabProps {
  averageServicePriceLabel: string;
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  getServiceLabel: (serviceId: string) => string;
  isServiceEditorOpen: boolean;
  onEditService: (serviceId: string) => void;
  onToggleActivation: (service: ProfessionalManagedService) => void;
  selectedServiceId: string;
  serviceConfigurations: ProfessionalManagedService[];
}

export const ProfessionalDashboardServicesTab = ({
  averageServicePriceLabel,
  getModeLabel,
  getServiceLabel,
  isServiceEditorOpen,
  onEditService,
  onToggleActivation,
  selectedServiceId,
  serviceConfigurations,
}: ProfessionalDashboardServicesTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const activeServices = serviceConfigurations.filter((service) => service.isActive);
  const templateServices = serviceConfigurations.filter((service) => !service.isActive);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard label={t('services.activeLabel')} value={String(activeServices.length)} />
        <MiniStatCard label={t('services.averagePriceLabel')} value={averageServicePriceLabel} />
      </div>

      <div className={surfaceCardPaddedClass}>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('services.title')}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{t('services.description')}</p>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('services.activeLabel')}
            </p>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700">
              {activeServices.length} {t('services.activeCount')}
            </span>
          </div>

          <div className="mt-3 grid gap-3">
            {activeServices.map((service) => {
              const bookingFlowLabel =
                service.bookingFlow === 'instant'
                  ? professionalT('bookingFlowInstant')
                  : professionalT('bookingFlowRequest');

              return (
                <article
                  key={service.serviceId}
                  className={`rounded-[22px] border px-4 py-4 transition-all ${
                    selectedServiceId === service.serviceId && isServiceEditorOpen
                      ? 'border-blue-500 bg-blue-50 shadow-[0_20px_36px_-30px_rgba(37,99,235,0.45)]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-bold text-slate-900">{getServiceLabel(service.serviceId)}</h2>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{service.summary}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                        {t('services.activeBadge')}
                      </span>
                      {service.featured ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                          {t('services.featuredBadge')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ServiceMetricTile label={t('services.fields.price')} value={service.price} />
                    <ServiceMetricTile label={t('services.fields.duration')} value={service.duration} />
                    <ServiceMetricTile label={t('services.fields.bookingFlow')} value={bookingFlowLabel} />
                    <ServiceMetricTile
                      label={t('services.fields.defaultMode')}
                      value={getModeLabel(service.defaultMode)}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {deliveryModes.map((mode) => (
                      <ServiceModeBadge
                        key={mode}
                        isActive={isServiceModeEnabled(service.serviceModes, mode)}
                        isDefault={service.defaultMode === mode}
                        label={getModeLabel(mode)}
                      />
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-slate-200/80 pt-4">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="grid gap-1 text-[12px] text-slate-500">
                        <p>
                          {t('services.fields.capacity')}:{' '}
                          <span className="font-semibold text-slate-700">
                            {t('units.weeklyCapacity', { count: service.weeklyCapacity })}
                          </span>
                        </p>
                        <p>
                          {t('services.fields.leadTime')}:{' '}
                          <span className="font-semibold text-slate-700">
                            {t('units.hoursShort', { count: service.leadTimeHours })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => onEditService(service.serviceId)}
                        className="flex w-full items-center justify-center rounded-[18px] bg-slate-900 px-4 py-3 text-[13px] font-bold text-white"
                      >
                        {t('services.editButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleActivation(service)}
                        className="flex w-full items-center justify-center rounded-[18px] bg-slate-100 px-4 py-3 text-[13px] font-bold text-slate-700"
                      >
                        {t('services.archiveButton')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('services.templateLibrary')}
            </p>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {templateServices.length}
            </span>
          </div>

          <div className="mt-3 grid gap-3">
            {templateServices.map((service) => (
              <article
                key={service.serviceId}
                className={`rounded-[20px] border px-4 py-3.5 transition-all ${
                  selectedServiceId === service.serviceId && isServiceEditorOpen
                    ? 'border-blue-500 bg-blue-50 shadow-[0_20px_36px_-30px_rgba(37,99,235,0.45)]'
                    : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-900">{getServiceLabel(service.serviceId)}</h3>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-600">{service.summary}</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                    {t('services.templateBadge')}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <ServiceMetaChip label={t('services.fields.price')} value={service.price} />
                  <ServiceMetaChip label={t('services.fields.duration')} value={service.duration} />
                  <ServiceMetaChip label={t('services.fields.defaultMode')} value={getModeLabel(service.defaultMode)} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {deliveryModes.map((mode) => (
                    <ServiceModeBadge
                      key={mode}
                      isActive={isServiceModeEnabled(service.serviceModes, mode)}
                      isDefault={service.defaultMode === mode}
                      label={getModeLabel(mode)}
                    />
                  ))}
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleActivation(service)}
                    className="flex w-full items-center justify-center rounded-[18px] bg-blue-600 px-4 py-3 text-[13px] font-bold text-white"
                  >
                    {t('services.activateButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditService(service.serviceId)}
                    className="flex w-full items-center justify-center rounded-[18px] bg-white px-4 py-3 text-[13px] font-bold text-slate-700"
                  >
                    {t('services.editButton')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
