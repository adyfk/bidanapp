'use client';

import React from 'react';
import { House, Stethoscope, Video } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import {
  ProfessionalSectionTitle,
} from '@/features/professional-detail/components/ProfessionalSectionTitle';
import type { ProfessionalServiceEntry } from '@/features/professional-detail/hooks/useProfessionalDetail';

interface ProfessionalServicesSectionProps {
  offeredServices: ProfessionalServiceEntry[];
  onSelectService: (serviceId: string) => void;
  profileCopy: {
    serviceSectionTitle: string;
  };
  selectedService: string;
}

export const ProfessionalServicesSection = ({
  offeredServices,
  onSelectService,
  profileCopy,
  selectedService,
}: ProfessionalServicesSectionProps) => {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm">
      <ProfessionalSectionTitle icon={<Stethoscope className="h-4 w-4" />} title={profileCopy.serviceSectionTitle} />
      <div className="space-y-3">
        {offeredServices.map(({ serviceMapping, catalogService }) => {
          const isSelected = selectedService === serviceMapping.serviceId;
          const ServiceTypeIcon = catalogService.type === 'visit' ? House : Video;

          return (
            <button
              key={serviceMapping.serviceId}
              onClick={() => onSelectService(serviceMapping.serviceId)}
              className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                isSelected
                  ? 'shadow-[0_16px_34px_-18px_rgba(233,30,140,0.25)]'
                  : 'shadow-[0_14px_28px_-24px_rgba(17,24,39,0.24)] hover:shadow-[0_18px_32px_-22px_rgba(17,24,39,0.28)]'
              }`}
              style={{
                borderColor: isSelected ? 'rgba(233, 30, 140, 0.18)' : 'transparent',
                backgroundColor: isSelected ? '#FFF7FB' : '#FCFCFC',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span
                    className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                  >
                    <ServiceTypeIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-bold text-gray-900">{catalogService.name}</h4>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                      >
                        {catalogService.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                      {serviceMapping.summary || catalogService.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-[16px] font-bold text-gray-900">{serviceMapping.price}</p>
                  <p className="mt-1 text-[11px] font-medium text-gray-500">{serviceMapping.duration}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {catalogService.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {catalogService.highlights.slice(0, 2).map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2 text-[12px] text-gray-600">
                    <span
                      className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: APP_CONFIG.colors.primary }}
                    />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
