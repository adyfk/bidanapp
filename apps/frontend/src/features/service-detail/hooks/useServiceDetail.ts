'use client';

import { useState } from 'react';
import {
  MOCK_CATEGORIES,
  MOCK_PROFESSIONALS,
  MOCK_SERVICES,
  getBookingMessage,
} from '@/lib/constants';

export interface ServiceProviderSummary {
  availabilityLabel: string;
  badgeLabel: string;
  id: string;
  image: string;
  location: string;
  name: string;
  providedServiceDuration?: string;
  providedServicePrice?: string;
  rating: number;
  slug: string;
}

export const useServiceDetail = (serviceId: string) => {
  const [notice, setNotice] = useState<string | null>(null);
  const service = MOCK_SERVICES.find((item) => item.id === serviceId) || null;
  const categoryName = service
    ? MOCK_CATEGORIES.find((category) => category.id === service.categoryId)?.name || ''
    : '';
  const providers: ServiceProviderSummary[] = service
    ? MOCK_PROFESSIONALS.filter((professional) =>
        professional.services.some((professionalService) => professionalService.serviceId === service.id)
      ).map((professional) => {
        const professionalService = professional.services.find(
          (serviceMapping) => serviceMapping.serviceId === service.id
        );

        return {
          availabilityLabel: professional.availabilityLabel,
          badgeLabel: professional.badgeLabel,
          id: professional.id,
          image: professional.image,
          location: professional.location,
          name: professional.name,
          providedServiceDuration: professionalService?.duration,
          providedServicePrice: professionalService?.price,
          rating: professional.rating,
          slug: professional.slug,
        };
      })
    : [];

  const requestBooking = (providerName?: string) => {
    if (!service) {
      return;
    }

    setNotice(
      providerName
        ? `${getBookingMessage(service.type)} Profesional terpilih: ${providerName}.`
        : getBookingMessage(service.type)
    );
  };

  return {
    categoryName,
    notice,
    providers,
    requestBooking,
    service,
    setNotice,
  };
};
