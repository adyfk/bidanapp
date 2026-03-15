'use client';

import type React from 'react';
import { useState } from 'react';
import { getBookingMessage, MOCK_CATEGORIES, MOCK_PROFESSIONALS, MOCK_SERVICES } from '@/lib/constants';
import type { Professional } from '@/types/catalog';

export interface ProfessionalTrustIndicator {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export interface ProfessionalServiceEntry {
  catalogService: (typeof MOCK_SERVICES)[number];
  serviceMapping: Professional['services'][number];
}

export const useProfessionalDetail = (professionalSlug: string | undefined) => {
  const [notice, setNotice] = useState<string | null>(null);
  const professional = MOCK_PROFESSIONALS.find((item) => item.slug === professionalSlug) || null;
  const profCategory = professional
    ? MOCK_CATEGORIES.find((category) => category.id === professional.categoryId)?.name || 'Professional'
    : 'Professional';
  const offeredServices: ProfessionalServiceEntry[] = professional
    ? professional.services.flatMap((serviceMapping) => {
        const catalogService = MOCK_SERVICES.find((service) => service.id === serviceMapping.serviceId);

        return catalogService ? [{ catalogService, serviceMapping }] : [];
      })
    : [];
  const [selectedService, setSelectedService] = useState<string>(
    offeredServices.length > 0 ? offeredServices[0].serviceMapping.serviceId : '',
  );
  const selectedServiceEntry =
    offeredServices.find(({ serviceMapping }) => serviceMapping.serviceId === selectedService) || null;

  const requestBooking = () => {
    if (!selectedServiceEntry) {
      return;
    }

    setNotice(
      `${getBookingMessage(selectedServiceEntry.catalogService.type)} Layanan terpilih: ${selectedServiceEntry.catalogService.name}.`,
    );
  };

  const getServiceName = (serviceId?: string) =>
    serviceId ? MOCK_SERVICES.find((service) => service.id === serviceId)?.name : undefined;

  return {
    getServiceName,
    notice,
    offeredServices,
    professional,
    profCategory,
    requestBooking,
    selectedService,
    selectedServiceEntry,
    setNotice,
    setSelectedService,
  };
};
