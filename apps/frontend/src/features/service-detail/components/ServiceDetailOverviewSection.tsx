'use client';

import { useTranslations } from 'next-intl';
import { getEnabledServiceModes } from '@/lib/mock-db/catalog';
import { useUiText } from '@/lib/ui-text';
import type { GlobalService } from '@/types/catalog';

interface ServiceDetailOverviewSectionProps {
  service: GlobalService;
}

export const ServiceDetailOverviewSection = ({ service }: ServiceDetailOverviewSectionProps) => {
  const t = useTranslations('ServiceDetail');
  const professionalT = useTranslations('Professional');
  const uiText = useUiText();

  return (
    <>
      <section>
        <h2 className="mb-3 text-[18px] font-bold text-gray-900">{t('about', { service: uiText.terms.service })}</h2>
        <p className="text-[14px] leading-relaxed text-gray-600">{service.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-bold text-gray-900">{professionalT('serviceModes')}</h2>
        <div className="flex flex-wrap gap-2">
          {getEnabledServiceModes(service.serviceModes).map((mode) => (
            <span
              key={`${service.id}-${mode}`}
              className="rounded-full border border-gray-100 bg-white px-3 py-2 text-[12px] font-semibold text-gray-600 shadow-sm"
            >
              {mode === 'online'
                ? professionalT('modeOnline')
                : mode === 'home_visit'
                  ? professionalT('modeHomeVisit')
                  : professionalT('modeOnsite')}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-bold text-gray-900">{uiText.serviceHighlightsTitle}</h2>
        <div className="space-y-2">
          {service.highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-[18px] border border-gray-100 bg-white px-4 py-3 text-[13px] text-gray-600 shadow-sm"
            >
              {highlight}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
