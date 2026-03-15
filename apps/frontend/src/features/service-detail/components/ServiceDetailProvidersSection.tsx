'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, Heart, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { APP_CONFIG } from '@/lib/config';
import { professionalRoute } from '@/lib/routes';
import type { ServiceProviderSummary } from '@/features/service-detail/hooks/useServiceDetail';
import { useRouter } from '@/i18n/routing';

interface ServiceDetailProvidersSectionProps {
  onRequestBooking: (providerName: string) => void;
  providers: ServiceProviderSummary[];
}

export const ServiceDetailProvidersSection = ({
  onRequestBooking,
  providers,
}: ServiceDetailProvidersSectionProps) => {
  const router = useRouter();
  const t = useTranslations('ServiceDetail');

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-gray-900">
          {t('available', { professional: APP_CONFIG.terms.professional })}
        </h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-600">
          {t('expertsCount', { count: providers.length })}
        </span>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            onClick={() => router.push(professionalRoute(provider.slug))}
            className="cursor-pointer rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
          >
            <div className="flex gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[16px] bg-gray-100">
                <Image src={provider.image} alt={provider.name} fill className="object-cover object-top" />
                <div className="absolute left-1 top-1 flex items-center rounded-lg bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                  <Heart className="mr-1 h-2.5 w-2.5 fill-red-500 text-red-500" />
                  <span className="text-[10px] font-bold text-gray-800">{provider.rating}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <h3 className="mb-1 text-[15px] font-bold text-gray-900">{provider.name}</h3>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: APP_CONFIG.colors.primary }}>
                  {provider.badgeLabel}
                </p>
                <p className="flex items-center text-[12px] font-medium text-gray-500">
                  <MapPin className="mr-1 h-3.5 w-3.5" /> {provider.location}
                </p>
                <p className="mt-1 text-[12px] text-gray-400">{provider.availabilityLabel}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex items-center text-[13px] font-medium text-gray-600">
                <Clock className="mr-1.5 h-4 w-4 text-gray-400" /> {provider.providedServiceDuration}
              </div>
              <div className="text-[15px] font-bold" style={{ color: APP_CONFIG.colors.primary }}>
                {provider.providedServicePrice}
              </div>
            </div>

            <div className="mt-2 flex gap-2 pt-1">
              <button
                type="button"
                className="w-full rounded-[12px] py-2.5 text-[13px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: APP_CONFIG.colors.primary }}
                onClick={(event) => {
                  event.stopPropagation();
                  onRequestBooking(provider.name);
                }}
              >
                {t('makeAppointment')}
              </button>
            </div>
          </div>
        ))}

        {providers.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">{t('noProfessionals')}</p>
        ) : null}
      </div>
    </section>
  );
};
