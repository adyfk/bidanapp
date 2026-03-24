'use client';

import { useState } from 'react';
import {
  getAccessibleServiceModes,
  getProfessionalCategoryLabel,
  getProfessionalCoverageStatus,
} from '@/lib/catalog-selectors';
import { professionalRoute } from '@/lib/routes';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import type {
  Area,
  Category,
  GlobalService,
  Professional,
  ProfessionalService,
  ServiceDeliveryMode,
  ServiceModeFlags,
} from '@/types/catalog';

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

export const useServiceDetail = ({
  areas,
  categories,
  professionals,
  serviceId,
  services,
}: {
  areas: Area[];
  categories: Category[];
  professionals: Professional[];
  serviceId: string;
  services: GlobalService[];
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const { selectedAreaId, userLocation } = useProfessionalUserPreferences();
  const service = services.find((item) => item.id === serviceId) || null;
  const categoryName = service ? categories.find((category) => category.id === service.categoryId)?.name || '' : '';
  const providers: ServiceProviderSummary[] = service
    ? professionals
        .filter((professional) =>
          professional.services.some((professionalService) => professionalService.serviceId === service.id),
        )
        .map((professional) => {
          const professionalService = professional.services.find(
            (serviceMapping) => serviceMapping.serviceId === service.id,
          );
          const coverageStatus = getProfessionalCoverageStatus({
            areas,
            professional,
            selectedAreaId,
            userLocation,
          });
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
            categoryLabel:
              getProfessionalCategoryLabel({
                categories,
                professional,
                services,
              }) || 'Professional',
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
      return null;
    }

    if (provider && !provider.canBook) {
      return null;
    }

    if (provider) {
      setNotice(null);
      return professionalRoute(provider.slug, {
        mode: provider.defaultMode,
        serviceId: service.id,
      });
    }

    return null;
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
