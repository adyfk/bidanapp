import type { GeoPoint, Professional, ProfessionalFeedbackSummary } from '@/types/catalog';

const EMPTY_GEO_POINT: GeoPoint = {
  latitude: 0,
  longitude: 0,
};

const EMPTY_FEEDBACK_SUMMARY: ProfessionalFeedbackSummary = {
  recommendationRate: '',
  repeatClientRate: '',
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const getProfessionalCoverageAreaIds = (
  professional: Pick<Professional, 'coverage'> | null | undefined,
): string[] => (isStringArray(professional?.coverage?.areaIds) ? professional.coverage.areaIds : []);

export const normalizeProfessional = (value: unknown): Professional => {
  const candidate = value as Partial<Professional>;

  return {
    ...(candidate as Professional),
    activityStories: Array.isArray(candidate.activityStories) ? candidate.activityStories : [],
    availability: candidate.availability || { isAvailable: false },
    availabilityRulesByMode:
      candidate.availabilityRulesByMode && typeof candidate.availabilityRulesByMode === 'object'
        ? candidate.availabilityRulesByMode
        : undefined,
    cancellationPoliciesByMode:
      candidate.cancellationPoliciesByMode && typeof candidate.cancellationPoliciesByMode === 'object'
        ? candidate.cancellationPoliciesByMode
        : undefined,
    coverage: {
      areaIds: getProfessionalCoverageAreaIds(candidate as Pick<Professional, 'coverage'>),
      center: candidate.coverage?.center || EMPTY_GEO_POINT,
      homeVisitRadiusKm:
        typeof candidate.coverage?.homeVisitRadiusKm === 'number' ? candidate.coverage.homeVisitRadiusKm : 0,
    },
    credentials: Array.isArray(candidate.credentials) ? candidate.credentials : [],
    feedbackBreakdown: Array.isArray(candidate.feedbackBreakdown) ? candidate.feedbackBreakdown : [],
    feedbackMetrics: Array.isArray(candidate.feedbackMetrics) ? candidate.feedbackMetrics : [],
    feedbackSummary: candidate.feedbackSummary || EMPTY_FEEDBACK_SUMMARY,
    gallery: Array.isArray(candidate.gallery) ? candidate.gallery : [],
    languages: Array.isArray(candidate.languages) ? candidate.languages : [],
    portfolioEntries: Array.isArray(candidate.portfolioEntries) ? candidate.portfolioEntries : [],
    practiceLocation: candidate.practiceLocation
      ? {
          address: candidate.practiceLocation.address || '',
          areaId: candidate.practiceLocation.areaId || '',
          coordinates: candidate.practiceLocation.coordinates || EMPTY_GEO_POINT,
          label: candidate.practiceLocation.label || '',
        }
      : undefined,
    recentActivities: Array.isArray(candidate.recentActivities) ? candidate.recentActivities : [],
    services: Array.isArray(candidate.services) ? candidate.services : [],
    specialties: Array.isArray(candidate.specialties) ? candidate.specialties : [],
    testimonials: Array.isArray(candidate.testimonials) ? candidate.testimonials : [],
  };
};
