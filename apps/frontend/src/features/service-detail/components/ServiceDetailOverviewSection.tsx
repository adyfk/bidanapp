'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { APP_CONFIG } from '@/lib/config';
import { SIMULATION_MESSAGES } from '@/lib/constants';
import type { GlobalService } from '@/types/catalog';

interface ServiceDetailOverviewSectionProps {
  service: GlobalService;
}

export const ServiceDetailOverviewSection = ({ service }: ServiceDetailOverviewSectionProps) => {
  const t = useTranslations('ServiceDetail');

  return (
    <>
      <section>
        <h2 className="mb-3 text-[18px] font-bold text-gray-900">
          {t('about', { service: APP_CONFIG.terms.service })}
        </h2>
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
        <h2 className="mb-3 text-[18px] font-bold text-gray-900">{SIMULATION_MESSAGES.serviceHighlightsTitle}</h2>
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
