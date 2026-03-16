import { PROFESSIONAL_REQUEST_STATUS_ORDER } from '@/features/professional-portal/lib/request-status';
import type {
  ProfessionalManagedGalleryItem,
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalPortalState,
} from '@/lib/use-professional-portal';
import type { Professional, ServiceDeliveryMode } from '@/types/catalog';
import type { CoverageDraft, GalleryDraft, NextAvailableSchedule, PortfolioDraft, ServiceDraft } from './types';

export const requestStatuses = PROFESSIONAL_REQUEST_STATUS_ORDER;
export const deliveryModes: ServiceDeliveryMode[] = ['online', 'home_visit', 'onsite'];

export const isServiceModeEnabled = (
  serviceModes: ProfessionalManagedService['serviceModes'],
  mode: ServiceDeliveryMode,
) => {
  if (mode === 'online') {
    return serviceModes.online;
  }

  if (mode === 'home_visit') {
    return serviceModes.homeVisit;
  }

  return serviceModes.onsite;
};

export const getNextAvailableSchedule = (professional: Professional): NextAvailableSchedule | null => {
  for (const service of professional.services) {
    for (const mode of ['home_visit', 'onsite'] as const) {
      const scheduleDay = service.scheduleByMode?.[mode]?.find((day) =>
        day.slots.some((slot) => slot.status !== 'booked'),
      );
      const slot = scheduleDay?.slots.find((timeSlot) => timeSlot.status !== 'booked');

      if (scheduleDay && slot) {
        return {
          dayLabel: scheduleDay.label,
          mode,
          serviceId: service.serviceId,
          slotLabel: slot.label,
        };
      }
    }
  }

  return null;
};

export const toServiceDraft = (service: ProfessionalManagedService): ServiceDraft => ({
  bookingFlow: service.bookingFlow,
  defaultMode: service.defaultMode,
  duration: service.duration,
  featured: service.featured,
  leadTimeHours: String(service.leadTimeHours),
  price: service.price,
  serviceModes: service.serviceModes,
  summary: service.summary,
  weeklyCapacity: String(service.weeklyCapacity),
});

export const toPortfolioDraft = (entry: ProfessionalManagedPortfolioEntry): PortfolioDraft => ({
  image: entry.image,
  outcomesText: entry.outcomes.join('\n'),
  periodLabel: entry.periodLabel,
  serviceId: entry.serviceId || '',
  summary: entry.summary,
  title: entry.title,
  visibility: entry.visibility,
});

export const toGalleryDraft = (item: ProfessionalManagedGalleryItem): GalleryDraft => ({
  alt: item.alt,
  image: item.image,
  isFeatured: item.isFeatured,
  label: item.label,
});

export const toCoverageDraft = (portalState: ProfessionalPortalState): CoverageDraft => ({
  acceptingNewClients: portalState.acceptingNewClients,
  autoApproveInstantBookings: portalState.autoApproveInstantBookings,
  city: portalState.city,
  coverageAreaIds: portalState.coverageAreaIds,
  homeVisitRadiusKm: String(portalState.homeVisitRadiusKm),
  latitude: String(portalState.coverageCenter.latitude),
  longitude: String(portalState.coverageCenter.longitude),
  monthlyCapacity: String(portalState.monthlyCapacity),
  practiceAddress: portalState.practiceAddress,
  practiceLabel: portalState.practiceLabel,
  practiceModes: portalState.practiceModes,
  publicBio: portalState.publicBio,
  responseTimeGoal: portalState.responseTimeGoal,
});

export const parseInteger = (value: string, fallback: number) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

export const buildOutcomes = (input: string) =>
  input
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
