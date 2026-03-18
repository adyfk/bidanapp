'use client';

import { Layers3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { accentSoftPillClass, neutralSoftPillClass, softWhitePanelClass } from '@/components/ui/tokens';
import type { ProfessionalManagedService } from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { deliveryModes, isServiceModeEnabled } from './helpers';
import {
  DashboardHeroPanel,
  MiniStatCard,
  ServiceMetaChip,
  ServiceMetricTile,
  ServiceModeBadge,
} from './ProfessionalDashboardShared';

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

      <DashboardHeroPanel
        icon={<Layers3 className="h-5 w-5" />}
        title={t('services.title')}
        description={t('services.description')}
      />

      <div className={`${softWhitePanelClass} p-4`}>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('services.activeLabel')}
            </p>
            <span className={accentSoftPillClass}>
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
                  className={`rounded-[24px] border px-4 py-4 transition-all ${
                    selectedServiceId === service.serviceId && isServiceEditorOpen
                      ? 'border-pink-100 bg-[linear-gradient(180deg,#FFF7FB_0%,#FFFFFF_100%)] shadow-[0_20px_36px_-30px_rgba(236,72,153,0.35)]'
                      : 'border-slate-200 bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.22)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-bold text-slate-900">{getServiceLabel(service.serviceId)}</h2>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{service.summary}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={accentSoftPillClass}>{t('services.activeBadge')}</span>
                      {service.featured ? (
                        <span className={neutralSoftPillClass}>{t('services.featuredBadge')}</span>
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
                    <div className={`${softWhitePanelClass} px-4 py-3`}>
                      <p className="text-[12px] font-semibold text-slate-500">
                        {t('services.availabilityNoteEyebrow')}
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-slate-900">
                        {t('services.availabilityNoteTitle')}
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                        {t('services.availabilityNoteDescription')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <ServiceActionButton variant="secondary" onClick={() => onEditService(service.serviceId)}>
                        {t('services.editButton')}
                      </ServiceActionButton>
                      <ServiceActionButton variant="ghost" onClick={() => onToggleActivation(service)}>
                        {t('services.archiveButton')}
                      </ServiceActionButton>
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
            <span className={neutralSoftPillClass}>{templateServices.length}</span>
          </div>

          <div className="mt-3 grid gap-3">
            {templateServices.map((service) => {
              return (
                <article
                  key={service.serviceId}
                  className={`rounded-[22px] border px-4 py-3.5 transition-all ${
                    selectedServiceId === service.serviceId && isServiceEditorOpen
                      ? 'border-pink-100 bg-[linear-gradient(180deg,#FFF7FB_0%,#FFFFFF_100%)] shadow-[0_20px_36px_-30px_rgba(236,72,153,0.35)]'
                      : 'border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF8FC_100%)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-slate-900">{getServiceLabel(service.serviceId)}</h3>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-600">{service.summary}</p>
                    </div>
                    <span className={neutralSoftPillClass}>{t('services.templateBadge')}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <ServiceMetaChip label={t('services.fields.price')} value={service.price} />
                    <ServiceMetaChip label={t('services.fields.duration')} value={service.duration} />
                    <ServiceMetaChip
                      label={t('services.fields.defaultMode')}
                      value={getModeLabel(service.defaultMode)}
                    />
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

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ServiceActionButton variant="primary" onClick={() => onToggleActivation(service)}>
                      {t('services.activateButton')}
                    </ServiceActionButton>
                    <ServiceActionButton variant="secondary" onClick={() => onEditService(service.serviceId)}>
                      {t('services.editButton')}
                    </ServiceActionButton>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

const ServiceActionButton = ({
  children,
  onClick,
  variant,
}: {
  children: string;
  onClick: () => void;
  variant: 'ghost' | 'primary' | 'secondary';
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[52px] w-full items-center justify-center rounded-[18px] px-4 py-3 text-center text-[13px] font-bold leading-5 transition-all active:scale-[0.99] ${
      variant === 'primary'
        ? 'bg-[linear-gradient(180deg,#F7259B_0%,#E11D87_100%)] text-white shadow-[0_18px_28px_-18px_rgba(233,30,140,0.42)]'
        : variant === 'secondary'
          ? 'bg-slate-900 text-white shadow-[0_18px_28px_-18px_rgba(15,23,42,0.34)]'
          : 'border border-slate-200 bg-white text-slate-700 shadow-[inset_0_0_0_1px_rgba(226,232,240,1)]'
    }`}
  >
    <span className="whitespace-normal">{children}</span>
  </button>
);
