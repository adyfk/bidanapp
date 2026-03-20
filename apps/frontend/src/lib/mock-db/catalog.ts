import areasData from '@/data/mock-db/areas.json';
import professionalActivityStoriesData from '@/data/mock-db/professional_activity_stories.json';
import professionalAvailabilityDateOverridesData from '@/data/mock-db/professional_availability_date_overrides.json';
import professionalAvailabilityPoliciesData from '@/data/mock-db/professional_availability_policies.json';
import professionalAvailabilityWeeklyHoursData from '@/data/mock-db/professional_availability_weekly_hours.json';
import professionalCancellationPoliciesData from '@/data/mock-db/professional_cancellation_policies.json';
import professionalCoverageAreasData from '@/data/mock-db/professional_coverage_areas.json';
import professionalCoveragePoliciesData from '@/data/mock-db/professional_coverage_policies.json';
import professionalCredentialsData from '@/data/mock-db/professional_credentials.json';
import professionalFeedbackBreakdownsData from '@/data/mock-db/professional_feedback_breakdowns.json';
import professionalFeedbackMetricsData from '@/data/mock-db/professional_feedback_metrics.json';
import professionalFeedbackSummariesData from '@/data/mock-db/professional_feedback_summaries.json';
import professionalGalleryItemsData from '@/data/mock-db/professional_gallery_items.json';
import professionalLanguagesData from '@/data/mock-db/professional_languages.json';
import professionalPortfolioEntriesData from '@/data/mock-db/professional_portfolio_entries.json';
import professionalPracticeLocationsData from '@/data/mock-db/professional_practice_locations.json';
import professionalServiceOfferingsData from '@/data/mock-db/professional_service_offerings.json';
import professionalSpecialtiesData from '@/data/mock-db/professional_specialties.json';
import professionalTestimonialsData from '@/data/mock-db/professional_testimonials.json';
import professionalsData from '@/data/mock-db/professionals.json';
import serviceCategoriesData from '@/data/mock-db/service_categories.json';
import servicesData from '@/data/mock-db/services.json';
import {
  DEFAULT_BOOKING_WINDOW_DAYS,
  DEFAULT_BOOKING_WINDOW_START_ISO,
  generateAvailabilityScheduleDays,
  normalizeAvailabilityRulesByMode,
  OFFLINE_SERVICE_MODES,
} from '@/lib/availability-rules';
import { ACTIVE_RUNTIME_CLOCK_ISO } from '@/lib/mock-db/runtime-selection';
import type { AppointmentStatus } from '@/types/appointments';
import type {
  Area,
  Category,
  GeoPoint,
  GlobalService,
  OfflineServiceDeliveryMode,
  Professional,
  ProfessionalAvailabilityDateOverride,
  ProfessionalAvailabilityRules,
  ProfessionalAvailabilityWeekday,
  ProfessionalCancellationPolicy,
  ProfessionalService,
  ProfessionalWeeklyAvailabilityWindow,
  ServiceDeliveryMode,
  ServiceModeFlags,
  TimeSlotStatus,
} from '@/types/catalog';
import type {
  ProfessionalActivityStoryRow,
  ProfessionalAvailabilityDateOverrideRow,
  ProfessionalAvailabilityPolicyRow,
  ProfessionalAvailabilityWeeklyHoursRow,
  ProfessionalCancellationPolicyRow,
  ProfessionalCoverageAreaRow,
  ProfessionalCoveragePolicyRow,
  ProfessionalCredentialRow,
  ProfessionalFeedbackBreakdownRow,
  ProfessionalFeedbackMetricRow,
  ProfessionalFeedbackSummaryRow,
  ProfessionalGalleryItemRow,
  ProfessionalLabelRow,
  ProfessionalPortfolioEntryRow,
  ProfessionalPracticeLocationRow,
  ProfessionalRow,
  ProfessionalServiceOfferingRow,
  ProfessionalTestimonialRow,
} from '@/types/mock-db';
import { APPOINTMENT_ROWS } from './appointment-records';
import { getRequiredItem, sortByIndex } from './utils';

const groupBy = <T, K>(items: T[], getKey: (item: T) => K) => {
  const grouped = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const existing = grouped.get(key);

    if (existing) {
      existing.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
};

const areas = sortByIndex(areasData as Area[]);
const categories = sortByIndex(serviceCategoriesData as Category[]);
const services = sortByIndex(servicesData as GlobalService[]);
const professionals = sortByIndex(professionalsData as ProfessionalRow[]);
const professionalSpecialties = sortByIndex(professionalSpecialtiesData as ProfessionalLabelRow[]);
const professionalLanguages = sortByIndex(professionalLanguagesData as ProfessionalLabelRow[]);
const professionalPracticeLocations = sortByIndex(
  professionalPracticeLocationsData as ProfessionalPracticeLocationRow[],
);
const professionalCoveragePolicies = sortByIndex(professionalCoveragePoliciesData as ProfessionalCoveragePolicyRow[]);
const professionalCoverageAreas = sortByIndex(professionalCoverageAreasData as ProfessionalCoverageAreaRow[]);
const professionalCredentials = sortByIndex(professionalCredentialsData as ProfessionalCredentialRow[]);
const professionalActivityStories = sortByIndex(professionalActivityStoriesData as ProfessionalActivityStoryRow[]);
const professionalPortfolioEntries = sortByIndex(professionalPortfolioEntriesData as ProfessionalPortfolioEntryRow[]);
const professionalGalleryItems = sortByIndex(professionalGalleryItemsData as ProfessionalGalleryItemRow[]);
const professionalTestimonials = sortByIndex(professionalTestimonialsData as ProfessionalTestimonialRow[]);
const professionalFeedbackSummaries = sortByIndex(
  professionalFeedbackSummariesData as ProfessionalFeedbackSummaryRow[],
);
const professionalFeedbackMetrics = sortByIndex(professionalFeedbackMetricsData as ProfessionalFeedbackMetricRow[]);
const professionalFeedbackBreakdowns = sortByIndex(
  professionalFeedbackBreakdownsData as ProfessionalFeedbackBreakdownRow[],
);
const professionalAvailabilityWeeklyHours = sortByIndex(
  professionalAvailabilityWeeklyHoursData as ProfessionalAvailabilityWeeklyHoursRow[],
);
const professionalAvailabilityPolicies = sortByIndex(
  professionalAvailabilityPoliciesData as ProfessionalAvailabilityPolicyRow[],
);
const professionalCancellationPolicies = sortByIndex(
  professionalCancellationPoliciesData as ProfessionalCancellationPolicyRow[],
);
const professionalAvailabilityDateOverrides = sortByIndex(
  professionalAvailabilityDateOverridesData as ProfessionalAvailabilityDateOverrideRow[],
);
const professionalServiceOfferings = sortByIndex(professionalServiceOfferingsData as ProfessionalServiceOfferingRow[]);

const specialtyRowsByProfessionalId = groupBy(professionalSpecialties, (row) => row.professionalId);
const languageRowsByProfessionalId = groupBy(professionalLanguages, (row) => row.professionalId);
const practiceLocationByProfessionalId = new Map(professionalPracticeLocations.map((row) => [row.professionalId, row]));
const coveragePolicyByProfessionalId = new Map(professionalCoveragePolicies.map((row) => [row.professionalId, row]));
const coverageAreaRowsByProfessionalId = groupBy(professionalCoverageAreas, (row) => row.professionalId);
const credentialRowsByProfessionalId = groupBy(professionalCredentials, (row) => row.professionalId);
const activityStoryRowsByProfessionalId = groupBy(professionalActivityStories, (row) => row.professionalId);
const portfolioEntryRowsByProfessionalId = groupBy(professionalPortfolioEntries, (row) => row.professionalId);
const galleryItemRowsByProfessionalId = groupBy(professionalGalleryItems, (row) => row.professionalId);
const testimonialRowsByProfessionalId = groupBy(professionalTestimonials, (row) => row.professionalId);
const feedbackSummaryByProfessionalId = new Map(professionalFeedbackSummaries.map((row) => [row.professionalId, row]));
const feedbackMetricRowsByProfessionalId = groupBy(professionalFeedbackMetrics, (row) => row.professionalId);
const feedbackBreakdownRowsByProfessionalId = groupBy(professionalFeedbackBreakdowns, (row) => row.professionalId);
const availabilityWeeklyHourRowsByProfessionalId = groupBy(
  professionalAvailabilityWeeklyHours,
  (row) => row.professionalId,
);
const availabilityPolicyRowsByProfessionalId = groupBy(professionalAvailabilityPolicies, (row) => row.professionalId);
const cancellationPolicyRowsByProfessionalId = groupBy(professionalCancellationPolicies, (row) => row.professionalId);
const availabilityDateOverrideRowsByProfessionalId = groupBy(
  professionalAvailabilityDateOverrides,
  (row) => row.professionalId,
);
const serviceOfferingRowsByProfessionalId = groupBy(professionalServiceOfferings, (row) => row.professionalId);
const appointmentRecentActivitiesByProfessionalId = groupBy(
  APPOINTMENT_ROWS.flatMap((appointmentRow) =>
    appointmentRow.recentActivity
      ? [
          {
            index: appointmentRow.index,
            professionalId: appointmentRow.professionalId,
            ...appointmentRow.recentActivity,
          },
        ]
      : [],
  ),
  (row) => row.professionalId,
);
const appointmentTestimonialsByProfessionalId = groupBy(
  APPOINTMENT_ROWS.flatMap((appointmentRow) =>
    appointmentRow.customerFeedback
      ? [
          {
            index: appointmentRow.index,
            professionalId: appointmentRow.professionalId,
            serviceId: appointmentRow.serviceId,
            ...appointmentRow.customerFeedback,
          },
        ]
      : [],
  ),
  (row) => row.professionalId,
);

export const SERVICE_DELIVERY_MODE_ORDER: ServiceDeliveryMode[] = ['online', 'home_visit', 'onsite'];
export const isOfflineServiceMode = (mode: ServiceDeliveryMode): mode is OfflineServiceDeliveryMode =>
  mode !== 'online';

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const buildServiceModes = (offering: ProfessionalServiceOfferingRow): ServiceModeFlags => ({
  homeVisit: offering.supportsHomeVisit,
  online: offering.supportsOnline,
  onsite: offering.supportsOnsite,
});

const hydrateWeeklyAvailabilityWindow = (
  weeklyHoursRow: ProfessionalAvailabilityWeeklyHoursRow,
): ProfessionalWeeklyAvailabilityWindow => ({
  endTime: weeklyHoursRow.endTime,
  id: weeklyHoursRow.id,
  index: weeklyHoursRow.index,
  isEnabled: true,
  slotIntervalMinutes: weeklyHoursRow.slotIntervalMinutes,
  startTime: weeklyHoursRow.startTime,
  weekday: weeklyHoursRow.weekday as ProfessionalAvailabilityWeekday,
});

const hydrateAvailabilityDateOverride = (
  dateOverrideRow: ProfessionalAvailabilityDateOverrideRow,
): ProfessionalAvailabilityDateOverride => ({
  dateIso: dateOverrideRow.dateIso,
  endTime: dateOverrideRow.endTime || undefined,
  id: dateOverrideRow.id,
  index: dateOverrideRow.index,
  isClosed: dateOverrideRow.isClosed,
  note: dateOverrideRow.note || undefined,
  slotIntervalMinutes: dateOverrideRow.slotIntervalMinutes || undefined,
  startTime: dateOverrideRow.startTime || undefined,
});

const hydrateProfessionalCancellationPoliciesByMode = (
  professionalId: string,
): Partial<Record<ServiceDeliveryMode, ProfessionalCancellationPolicy>> | undefined => {
  const policyRows = sortByIndex(cancellationPolicyRowsByProfessionalId.get(professionalId) || []);

  if (policyRows.length === 0) {
    return undefined;
  }

  return policyRows.reduce<Partial<Record<ServiceDeliveryMode, ProfessionalCancellationPolicy>>>((policies, row) => {
    policies[row.mode] = {
      afterCutoffOutcome: row.afterCutoffOutcome,
      beforeCutoffOutcome: row.beforeCutoffOutcome,
      customerPaidCancelCutoffHours: row.customerPaidCancelCutoffHours,
      professionalCancelOutcome: row.professionalCancelOutcome,
    };
    return policies;
  }, {});
};

const hydrateProfessionalAvailabilityRulesByMode = (
  professionalId: string,
): Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>> | undefined => {
  const weeklyHoursRows = sortByIndex(availabilityWeeklyHourRowsByProfessionalId.get(professionalId) || []);
  const availabilityPolicyRows = sortByIndex(availabilityPolicyRowsByProfessionalId.get(professionalId) || []);
  const dateOverrideRows = sortByIndex(availabilityDateOverrideRowsByProfessionalId.get(professionalId) || []);
  const availabilityRulesByMode: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>> = {};

  for (const mode of OFFLINE_SERVICE_MODES) {
    const availabilityPolicy = availabilityPolicyRows.find((row) => row.mode === mode);
    const normalizedRuleSet = normalizeAvailabilityRulesByMode(
      {
        [mode]: {
          dateOverrides: dateOverrideRows.filter((row) => row.mode === mode).map(hydrateAvailabilityDateOverride),
          minimumNoticeHours: availabilityPolicy?.minimumNoticeHours,
          weeklyHours: weeklyHoursRows.filter((row) => row.mode === mode).map(hydrateWeeklyAvailabilityWindow),
        },
      },
      undefined,
    )?.[mode];

    if (normalizedRuleSet) {
      availabilityRulesByMode[mode] = normalizedRuleSet;
    }
  }

  return Object.keys(availabilityRulesByMode).length > 0 ? availabilityRulesByMode : undefined;
};

const activeSlotBlockingStatuses: AppointmentStatus[] = ['confirmed', 'in_service'];
const tentativeSlotBlockingStatuses: AppointmentStatus[] = ['requested', 'approved_waiting_payment', 'paid'];

const extractScheduleTimeLabel = (scheduledTimeLabel: string) => scheduledTimeLabel.match(/(\d{2}:\d{2})/)?.[1];

const appointmentSlotOccupancyByKey = groupBy(
  APPOINTMENT_ROWS.flatMap((appointmentRow) => {
    if (!isOfflineServiceMode(appointmentRow.requestedMode)) {
      return [];
    }

    const dateIso = appointmentRow.scheduleSnapshot.dateIso;
    const timeLabel =
      appointmentRow.scheduleSnapshot.timeSlotLabel || extractScheduleTimeLabel(appointmentRow.scheduledTimeLabel);

    if (!dateIso || !timeLabel) {
      return [];
    }

    return [
      {
        key: `${appointmentRow.professionalId}:${appointmentRow.requestedMode}:${dateIso}:${timeLabel}`,
        status: appointmentRow.status,
      },
    ];
  }),
  (entry) => entry.key,
);

const getGeneratedSlotStatus = (
  professionalId: string,
  mode: OfflineServiceDeliveryMode,
  dateIso: string,
  timeLabel: string,
): TimeSlotStatus => {
  const occupancyEntries = appointmentSlotOccupancyByKey.get(`${professionalId}:${mode}:${dateIso}:${timeLabel}`) || [];

  if (occupancyEntries.some((entry) => activeSlotBlockingStatuses.includes(entry.status))) {
    return 'booked';
  }

  if (occupancyEntries.some((entry) => tentativeSlotBlockingStatuses.includes(entry.status))) {
    return 'limited';
  }

  return 'available';
};

const hydrateProfessionalService = (offering: ProfessionalServiceOfferingRow): ProfessionalService => {
  return {
    bookingFlow: offering.bookingFlow,
    defaultMode: offering.defaultMode,
    duration: offering.duration,
    id: offering.id,
    index: offering.index,
    price: offering.price,
    serviceId: offering.serviceId,
    serviceModes: buildServiceModes(offering),
    summary: offering.summary || undefined,
  };
};

export const MOCK_AREAS: Area[] = areas;
export const MOCK_CATEGORIES: Category[] = categories;
export const MOCK_SERVICES: GlobalService[] = services;
export const MOCK_PROFESSIONALS: Professional[] = professionals.map((professionalRow) => {
  const practiceLocation = practiceLocationByProfessionalId.get(professionalRow.id);
  const coveragePolicy = getRequiredItem(
    coveragePolicyByProfessionalId.get(professionalRow.id),
    `professional_coverage_policies.professionalId -> ${professionalRow.id}`,
  );
  const feedbackSummary = getRequiredItem(
    feedbackSummaryByProfessionalId.get(professionalRow.id),
    `professional_feedback_summaries.professionalId -> ${professionalRow.id}`,
  );
  const linkedTestimonials = sortByIndex(appointmentTestimonialsByProfessionalId.get(professionalRow.id) || []).map(
    (row) => ({
      author: row.author,
      dateLabel: row.dateLabel,
      image: row.image,
      index: row.index,
      quote: row.quote,
      rating: row.rating,
      role: row.role,
      serviceId: row.serviceId,
    }),
  );
  const seededTestimonials = sortByIndex(testimonialRowsByProfessionalId.get(professionalRow.id) || []).map(
    (row, index) => ({
      author: row.author,
      dateLabel: row.dateLabel,
      image: row.image,
      index: linkedTestimonials.length + index + 1,
      quote: row.quote,
      rating: row.rating,
      role: row.role,
      serviceId: row.serviceId || undefined,
    }),
  );

  return {
    about: professionalRow.about,
    activityStories: sortByIndex(activityStoryRowsByProfessionalId.get(professionalRow.id) || []).map((row) => ({
      capturedAt: row.capturedAt,
      image: row.image,
      index: row.index,
      location: row.location,
      note: row.note,
      title: row.title,
    })),
    availability: {
      isAvailable: professionalRow.isAvailable,
    },
    availabilityRulesByMode: hydrateProfessionalAvailabilityRulesByMode(professionalRow.id),
    badgeLabel: professionalRow.badgeLabel,
    cancellationPoliciesByMode: hydrateProfessionalCancellationPoliciesByMode(professionalRow.id),
    clientsServed: professionalRow.clientsServed,
    coverImage: professionalRow.coverImage || undefined,
    coverage: {
      areaIds: sortByIndex(coverageAreaRowsByProfessionalId.get(professionalRow.id) || []).map((row) => row.areaId),
      center: {
        latitude: coveragePolicy.centerLatitude,
        longitude: coveragePolicy.centerLongitude,
      },
      homeVisitRadiusKm: coveragePolicy.homeVisitRadiusKm,
    },
    credentials: sortByIndex(credentialRowsByProfessionalId.get(professionalRow.id) || []).map((row) => ({
      index: row.index,
      issuer: row.issuer,
      note: row.note,
      title: row.title,
      year: row.year,
    })),
    experience: professionalRow.experience,
    feedbackBreakdown: sortByIndex(feedbackBreakdownRowsByProfessionalId.get(professionalRow.id) || []).map((row) => ({
      index: row.index,
      label: row.label,
      percentage: row.percentage,
      total: row.total,
    })),
    feedbackMetrics: sortByIndex(feedbackMetricRowsByProfessionalId.get(professionalRow.id) || []).map((row) => ({
      detail: row.detail,
      index: row.index,
      label: row.label,
      value: row.value,
    })),
    feedbackSummary: {
      recommendationRate: feedbackSummary.recommendationRate,
      repeatClientRate: feedbackSummary.repeatClientRate,
    },
    gallery: sortByIndex(galleryItemRowsByProfessionalId.get(professionalRow.id) || []).map((row) => ({
      alt: row.alt,
      id: row.id,
      image: row.image,
      index: row.index,
      label: row.label,
    })),
    gender: professionalRow.gender,
    id: professionalRow.id,
    image: professionalRow.image,
    index: professionalRow.index,
    languages: sortByIndex(languageRowsByProfessionalId.get(professionalRow.id) || []).map((row) => row.label),
    location: professionalRow.location,
    name: professionalRow.name,
    portfolioEntries: sortByIndex(portfolioEntryRowsByProfessionalId.get(professionalRow.id) || []).map((row) => ({
      id: row.id,
      image: row.image,
      index: row.index,
      outcomes: row.outcomes,
      periodLabel: row.periodLabel,
      serviceId: row.serviceId || undefined,
      summary: row.summary,
      title: row.title,
    })),
    practiceLocation: practiceLocation
      ? {
          address: practiceLocation.address,
          areaId: practiceLocation.areaId,
          coordinates: {
            latitude: practiceLocation.latitude,
            longitude: practiceLocation.longitude,
          },
          label: practiceLocation.label,
        }
      : undefined,
    rating: professionalRow.rating,
    recentActivities: sortByIndex(appointmentRecentActivitiesByProfessionalId.get(professionalRow.id) || []).map(
      (row) => ({
        channel: row.channel,
        dateLabel: row.dateLabel,
        index: row.index,
        summary: row.summary,
        title: row.title,
      }),
    ),
    responseTime: professionalRow.responseTime,
    reviews: professionalRow.reviews,
    services: sortByIndex(serviceOfferingRowsByProfessionalId.get(professionalRow.id) || []).map(
      hydrateProfessionalService,
    ),
    slug: professionalRow.slug,
    specialties: sortByIndex(specialtyRowsByProfessionalId.get(professionalRow.id) || []).map((row) => row.label),
    testimonials: [...linkedTestimonials, ...seededTestimonials],
    title: professionalRow.title,
  };
});

const areasById = new Map(MOCK_AREAS.map((area) => [area.id, area]));
const categoriesById = new Map(MOCK_CATEGORIES.map((category) => [category.id, category]));
const servicesById = new Map(MOCK_SERVICES.map((service) => [service.id, service]));
const servicesBySlug = new Map(MOCK_SERVICES.map((service) => [service.slug, service]));
const professionalsById = new Map(MOCK_PROFESSIONALS.map((professional) => [professional.id, professional]));
const professionalsBySlug = new Map(MOCK_PROFESSIONALS.map((professional) => [professional.slug, professional]));

export const getAreaById = (areaId: string) => areasById.get(areaId);
export const getCategoryById = (categoryId: string) => categoriesById.get(categoryId);
export const getServiceById = (serviceId: string) => servicesById.get(serviceId);
export const getServiceBySlug = (serviceSlug: string) => servicesBySlug.get(serviceSlug);
export const getProfessionalById = (professionalId: string) => professionalsById.get(professionalId);
export const getProfessionalBySlug = (professionalSlug: string) => professionalsBySlug.get(professionalSlug);
export const getProfessionalCancellationPolicy = (professionalId: string, mode: ServiceDeliveryMode) =>
  professionalsById.get(professionalId)?.cancellationPoliciesByMode?.[mode];

const isServiceModeEnabled = (serviceModes: ServiceModeFlags, mode: ServiceDeliveryMode) => {
  if (mode === 'online') return serviceModes.online;
  if (mode === 'home_visit') return serviceModes.homeVisit;
  return serviceModes.onsite;
};

export const getEnabledServiceModes = (serviceModes: ServiceModeFlags) =>
  SERVICE_DELIVERY_MODE_ORDER.filter((mode) => isServiceModeEnabled(serviceModes, mode));

const mergeServiceModes = (...serviceModesList: ServiceModeFlags[]): ServiceModeFlags =>
  serviceModesList.reduce<ServiceModeFlags>(
    (accumulator, serviceModes) => ({
      homeVisit: accumulator.homeVisit || serviceModes.homeVisit,
      online: accumulator.online || serviceModes.online,
      onsite: accumulator.onsite || serviceModes.onsite,
    }),
    { homeVisit: false, online: false, onsite: false },
  );

export const getProfessionalServiceModes = (professional: Professional) =>
  mergeServiceModes(...professional.services.map((serviceOffering) => serviceOffering.serviceModes));

const getProfessionalCategoryIds = (professional: Professional) => {
  const categoryIds = new Set<string>();

  for (const serviceOffering of professional.services) {
    const service = getServiceById(serviceOffering.serviceId);

    if (service) {
      categoryIds.add(service.categoryId);
    }
  }

  return [...categoryIds];
};

export const getProfessionalCategories = (professional: Professional) =>
  getProfessionalCategoryIds(professional)
    .map((categoryId) => getCategoryById(categoryId))
    .filter(isDefined);

export const getProfessionalCategoryLabel = (professional: Professional, maxItems = 2) => {
  const categoryNames = getProfessionalCategories(professional).map((category) => category.name);

  if (categoryNames.length <= maxItems) {
    return categoryNames.join(' • ');
  }

  return `${categoryNames.slice(0, maxItems).join(' • ')} +${categoryNames.length - maxItems}`;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

export const getDistanceKm = (from: GeoPoint, to: GeoPoint) => {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearestAreaByPoint = (point: GeoPoint) => {
  if (MOCK_AREAS.length === 0) {
    return undefined;
  }

  return MOCK_AREAS.reduce((nearestArea, area) =>
    getDistanceKm(point, { latitude: area.latitude, longitude: area.longitude }) <
    getDistanceKm(point, { latitude: nearestArea.latitude, longitude: nearestArea.longitude })
      ? area
      : nearestArea,
  );
};

export const estimateTravelTimeMinutes = (distanceKm: number, averageSpeedKph = 25) =>
  Math.max(5, Math.round((distanceKm / averageSpeedKph) * 60));

export interface ProfessionalCoverageStatus {
  coveredAreas: Area[];
  distanceKm: number;
  isAreaCovered: boolean;
  isHomeVisitCovered: boolean;
  isWithinHomeVisitRadius: boolean;
  selectedArea?: Area;
}

export const getProfessionalCoverageStatus = (
  professional: Professional,
  userLocation: GeoPoint,
  selectedAreaId: string,
): ProfessionalCoverageStatus => {
  const selectedArea = getAreaById(selectedAreaId);
  const coveredAreas = professional.coverage.areaIds.map((areaId) => getAreaById(areaId)).filter(isDefined);
  const distanceKm = getDistanceKm(professional.coverage.center, userLocation);
  const isAreaCovered = selectedArea ? professional.coverage.areaIds.includes(selectedArea.id) : false;
  const isWithinHomeVisitRadius = distanceKm <= professional.coverage.homeVisitRadiusKm;

  return {
    coveredAreas,
    distanceKm,
    isAreaCovered,
    isHomeVisitCovered: isAreaCovered && isWithinHomeVisitRadius,
    isWithinHomeVisitRadius,
    selectedArea,
  };
};

export const getAccessibleServiceModes = (
  serviceModes: ServiceModeFlags,
  coverageStatus: ProfessionalCoverageStatus,
  isAvailable: boolean,
) =>
  getEnabledServiceModes(serviceModes).filter((mode) => {
    if (!isAvailable) {
      return false;
    }

    if (mode === 'home_visit') {
      return coverageStatus.isHomeVisitCovered;
    }

    return true;
  });

export const getProfessionalAvailabilityScheduleDays = (
  professional: Pick<Professional, 'availabilityRulesByMode' | 'id'>,
  mode: ServiceDeliveryMode,
  days = DEFAULT_BOOKING_WINDOW_DAYS,
  startDateIso = DEFAULT_BOOKING_WINDOW_START_ISO,
  referenceDateTimeIso = ACTIVE_RUNTIME_CLOCK_ISO,
) => {
  if (!isOfflineServiceMode(mode)) {
    return [];
  }

  return generateAvailabilityScheduleDays({
    days,
    getSlotStatus: (dateIso, timeLabel) => getGeneratedSlotStatus(professional.id, mode, dateIso, timeLabel),
    mode,
    professionalId: professional.id,
    referenceDateTimeIso,
    ruleSet: professional.availabilityRulesByMode?.[mode],
    startDateIso,
  });
};
