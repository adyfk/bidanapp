import { PROFESSIONAL_REQUEST_STATUS_ORDER } from '@/features/professional-portal/lib/request-status';
import {
  cloneAvailabilityRulesByMode,
  countDateOverrides,
  countEnabledWeeklyHours,
  formatMinimumNoticeLabel,
  OFFLINE_SERVICE_MODES,
} from '@/lib/availability-rules';
import type {
  ProfessionalManagedActivityStory,
  ProfessionalManagedCredential,
  ProfessionalManagedGalleryItem,
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalPortalState,
} from '@/lib/use-professional-portal';
import type { OfflineServiceDeliveryMode, ServiceDeliveryMode } from '@/types/catalog';
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
export const offlineDeliveryModes: OfflineServiceDeliveryMode[] = OFFLINE_SERVICE_MODES;

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

export const getManagedServiceModes = (
  serviceConfigurations: Pick<ProfessionalManagedService, 'isActive' | 'serviceModes'>[],
) =>
  deliveryModes.filter((mode) =>
    serviceConfigurations.some((service) => service.isActive && isServiceModeEnabled(service.serviceModes, mode)),
  );

export const buildManagedServicesAvailabilitySummary = (
  serviceConfigurations: Pick<ProfessionalManagedService, 'bookingFlow' | 'isActive' | 'serviceModes'>[],
  availabilityRulesByMode?: AvailabilityDraft['availabilityRulesByMode'],
) => {
  const activeServices = serviceConfigurations.filter((service) => service.isActive);
  const activeModes = getManagedServiceModes(activeServices);
  const minimumNoticeValues = offlineDeliveryModes
    .map((mode) => availabilityRulesByMode?.[mode]?.minimumNoticeHours)
    .filter((value): value is number => typeof value === 'number');
  const minimumNoticeLabel =
    minimumNoticeValues.length === 0
      ? null
      : minimumNoticeValues.every((value) => value === minimumNoticeValues[0])
        ? formatMinimumNoticeLabel(minimumNoticeValues[0])
        : `${formatMinimumNoticeLabel(Math.min(...minimumNoticeValues))} - ${formatMinimumNoticeLabel(Math.max(...minimumNoticeValues))}`;

  return {
    activeModes,
    activeServiceCount: activeServices.length,
    instantServiceCount: activeServices.filter((service) => service.bookingFlow === 'instant').length,
    minimumNoticeLabel,
    requestServiceCount: activeServices.filter((service) => service.bookingFlow === 'request').length,
    totalBookableDayCount: offlineDeliveryModes.reduce(
      (totalDays, mode) => totalDays + countEnabledWeeklyHours(availabilityRulesByMode?.[mode]),
      0,
    ),
    totalBookableSlotCount: offlineDeliveryModes.reduce(
      (totalSlots, mode) => totalSlots + countDateOverrides(availabilityRulesByMode?.[mode]),
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
  availabilityRulesByMode: cloneAvailabilityRulesByMode(portalState.availabilityRulesByMode),
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
