import { PROFESSIONAL_REQUEST_STATUS_ORDER } from '@/features/professional-portal/lib/request-status';
import type {
  ProfessionalManagedActivityStory,
  ProfessionalManagedCredential,
  ProfessionalManagedGalleryItem,
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalPortalState,
} from '@/lib/use-professional-portal';
import type { ProfessionalAvailabilityDay, ServiceDeliveryMode } from '@/types/catalog';
import type {
  ActivityStoryDraft,
  AvailabilityDraft,
  CoverageDraft,
  CredentialDraft,
  GalleryDraft,
  PortfolioDraft,
  ServiceDraft,
} from './types';

export const requestStatuses = PROFESSIONAL_REQUEST_STATUS_ORDER;
export const deliveryModes: ServiceDeliveryMode[] = ['online', 'home_visit', 'onsite'];
export const offlineDeliveryModes: ServiceDeliveryMode[] = ['home_visit', 'onsite'];

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

export const cloneAvailabilityDays = (scheduleDays?: ProfessionalAvailabilityDay[]) =>
  (scheduleDays || []).map((scheduleDay) => ({
    ...scheduleDay,
    slots: scheduleDay.slots.map((slot) => ({ ...slot })),
  }));

export const cloneAvailabilityByMode = (
  availabilityByMode?: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>>,
) => {
  const nextAvailabilityByMode: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>> = {};

  for (const mode of deliveryModes) {
    const scheduleDays = availabilityByMode?.[mode];

    if (scheduleDays && scheduleDays.length > 0) {
      nextAvailabilityByMode[mode] = cloneAvailabilityDays(scheduleDays);
    }
  }

  return nextAvailabilityByMode;
};

export const normalizeAvailabilityDays = (scheduleDays: ProfessionalAvailabilityDay[]) =>
  scheduleDays.map((scheduleDay, scheduleDayIndex) => ({
    ...scheduleDay,
    index: scheduleDayIndex + 1,
    slots: scheduleDay.slots.map((slot, slotIndex) => ({
      ...slot,
      index: slotIndex + 1,
    })),
  }));

export const countScheduleSlots = (scheduleDays?: ProfessionalAvailabilityDay[]) =>
  (scheduleDays || []).reduce((totalSlots, scheduleDay) => totalSlots + scheduleDay.slots.length, 0);

export const countBookableScheduleDays = (scheduleDays?: ProfessionalAvailabilityDay[]) =>
  (scheduleDays || []).filter((scheduleDay) => scheduleDay.slots.length > 0).length;

export const countBookableScheduleSlots = (scheduleDays?: ProfessionalAvailabilityDay[]) =>
  (scheduleDays || []).reduce(
    (totalSlots, scheduleDay) => totalSlots + (scheduleDay.slots.length > 0 ? scheduleDay.slots.length : 0),
    0,
  );

export const getManagedServiceModes = (
  serviceConfigurations: Pick<ProfessionalManagedService, 'isActive' | 'serviceModes'>[],
) =>
  deliveryModes.filter((mode) =>
    serviceConfigurations.some((service) => service.isActive && isServiceModeEnabled(service.serviceModes, mode)),
  );

export const buildManagedServicesAvailabilitySummary = (
  serviceConfigurations: Pick<ProfessionalManagedService, 'bookingFlow' | 'isActive' | 'serviceModes'>[],
  availabilityByMode?: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>>,
) => {
  const activeServices = serviceConfigurations.filter((service) => service.isActive);
  const activeModes = getManagedServiceModes(activeServices);

  return {
    activeModes,
    activeServiceCount: activeServices.length,
    instantServiceCount: activeServices.filter((service) => service.bookingFlow === 'instant').length,
    requestServiceCount: activeServices.filter((service) => service.bookingFlow === 'request').length,
    totalBookableDayCount: offlineDeliveryModes.reduce(
      (totalDays, mode) => totalDays + countBookableScheduleDays(availabilityByMode?.[mode]),
      0,
    ),
    totalBookableSlotCount: offlineDeliveryModes.reduce(
      (totalSlots, mode) => totalSlots + countBookableScheduleSlots(availabilityByMode?.[mode]),
      0,
    ),
  };
};

export const toServiceDraft = (service: ProfessionalManagedService): ServiceDraft => ({
  bookingFlow: service.bookingFlow,
  defaultMode: service.defaultMode,
  duration: service.duration,
  featured: service.featured,
  price: service.price,
  serviceModes: service.serviceModes,
  summary: service.summary,
});

export const toAvailabilityDraft = (portalState: ProfessionalPortalState): AvailabilityDraft => ({
  availabilityByMode: cloneAvailabilityByMode(portalState.availabilityByMode),
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

export const toCredentialDraft = (item: ProfessionalManagedCredential): CredentialDraft => ({
  issuer: item.issuer,
  note: item.note,
  title: item.title,
  year: item.year,
});

export const toActivityStoryDraft = (item: ProfessionalManagedActivityStory): ActivityStoryDraft => ({
  capturedAt: item.capturedAt,
  image: item.image,
  location: item.location,
  note: item.note,
  title: item.title,
});

export const toCoverageDraft = (portalState: ProfessionalPortalState): CoverageDraft => ({
  acceptingNewClients: portalState.acceptingNewClients,
  autoApproveInstantBookings: portalState.autoApproveInstantBookings,
  city: portalState.city,
  coverageAreaIds: portalState.coverageAreaIds,
  homeVisitRadiusKm: String(portalState.homeVisitRadiusKm),
  latitude: String(portalState.coverageCenter.latitude),
  longitude: String(portalState.coverageCenter.longitude),
  practiceAddress: portalState.practiceAddress,
  practiceLabel: portalState.practiceLabel,
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
