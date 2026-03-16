'use client';

import { useState } from 'react';
import {
  getAccessibleServiceModes,
  getProfessionalCategoryLabel,
  getProfessionalCoverageStatus,
  MOCK_CATEGORIES,
  MOCK_PROFESSIONALS,
  MOCK_SERVICES,
} from '@/lib/mock-db/catalog';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import type { ProfessionalService, ServiceDeliveryMode, ServiceModeFlags } from '@/types/catalog';

export interface ServiceProviderSummary {
  accessibleModes: ServiceDeliveryMode[];
  badgeLabel: string;
  bookingFlow: ProfessionalService['bookingFlow'];
  canBook: boolean;
  categoryLabel: string;
  defaultMode: ServiceDeliveryMode;
  isAvailable: boolean;
  isHomeVisitCovered: boolean;
  id: string;
  image: string;
  location: string;
  name: string;
  providedServiceDuration?: string;
  providedServicePrice?: string;
  rating: number;
  serviceModes: ServiceModeFlags;
  slug: string;
}

export const useServiceDetail = (serviceId: string) => {
  const uiText = useUiText();
  const [notice, setNotice] = useState<string | null>(null);
  const { selectedAreaId, userLocation } = useProfessionalUserPreferences();
  const service = MOCK_SERVICES.find((item) => item.id === serviceId) || null;
  const categoryName = service
    ? MOCK_CATEGORIES.find((category) => category.id === service.categoryId)?.name || ''
    : '';
  const providers: ServiceProviderSummary[] = service
    ? MOCK_PROFESSIONALS.filter((professional) =>
        professional.services.some((professionalService) => professionalService.serviceId === service.id),
      ).map((professional) => {
        const professionalService = professional.services.find(
          (serviceMapping) => serviceMapping.serviceId === service.id,
        );
        const coverageStatus = getProfessionalCoverageStatus(professional, userLocation, selectedAreaId);
        const accessibleModes = professionalService
          ? getAccessibleServiceModes(
              professionalService.serviceModes,
              coverageStatus,
              professional.availability.isAvailable,
            )
          : [];
        const bookingMode =
          professionalService && accessibleModes.includes(professionalService.defaultMode)
            ? professionalService.defaultMode
            : accessibleModes[0] || professionalService?.defaultMode || service.defaultMode;

        return {
          accessibleModes,
          badgeLabel: professional.badgeLabel,
          bookingFlow: professionalService?.bookingFlow || 'request',
          canBook: accessibleModes.length > 0,
          categoryLabel: getProfessionalCategoryLabel(professional) || 'Professional',
          defaultMode: bookingMode,
          isAvailable: professional.availability.isAvailable,
          isHomeVisitCovered: coverageStatus.isHomeVisitCovered,
          id: professional.id,
          image: professional.image,
          location: professional.location,
          name: professional.name,
          providedServiceDuration: professionalService?.duration,
          providedServicePrice: professionalService?.price,
          rating: professional.rating,
          serviceModes: professionalService?.serviceModes || service.serviceModes,
          slug: professional.slug,
        };
      })
    : [];

  const requestBooking = (provider?: ServiceProviderSummary) => {
    if (!service) {
      return;
    }

    if (provider && !provider.canBook) {
      return;
    }

    setNotice(
      provider
        ? uiText.getProviderBookingNotice(provider.defaultMode, provider.name)
        : uiText.getBookingMessage(service.defaultMode),
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
