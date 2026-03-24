import { createBidanappApiClient, fetchPublicBootstrap } from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import type { ConsumerProfile, UserContext } from '@/types/app-state';
import type { AppointmentStatus } from '@/types/appointments';
import type { Area, Category, GlobalService, Professional } from '@/types/catalog';

export interface PublicHomeFeedData {
  currentUser: ConsumerProfile;
  featuredAppointment?: {
    appointment: {
      id: string;
      status: AppointmentStatus;
    };
    dateLabel: string;
    professional: Professional;
    timeLabel: string;
  };
  id: string;
  nearbyProfessionals: Professional[];
  popularServices: GlobalService[];
  sharedContext: UserContext;
  title: string;
}

export interface PublicBootstrapData {
  activeHomeFeed: PublicHomeFeedData;
  appSectionConfig: {
    homeCategoryIds: string[];
  };
  catalog: {
    areas: Area[];
    categories: Category[];
    professionals: Professional[];
    services: GlobalService[];
  };
  currentConsumer: ConsumerProfile;
  currentUserContext: UserContext;
}

const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());

const EMPTY_AREA: Area = {
  city: '',
  district: '',
  id: '',
  index: 0,
  label: '',
  latitude: 0,
  longitude: 0,
  province: '',
};

const EMPTY_CONSUMER: ConsumerProfile = {
  avatar: '',
  id: '',
  index: 0,
  name: '',
  phone: '',
};

const EMPTY_USER_CONTEXT: UserContext = {
  area: EMPTY_AREA,
  currentArea: '',
  id: '',
  index: 0,
  onlineStatusLabel: '',
  userLocation: {
    latitude: 0,
    longitude: 0,
  },
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Public bootstrap request timed out')), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

const normalizeProfessional = (value: unknown): Professional => {
  const candidate = value as Partial<Professional>;

  return {
    ...(candidate as Professional),
    activityStories: Array.isArray(candidate.activityStories) ? candidate.activityStories : [],
    availability: candidate.availability || { isAvailable: false },
    coverage: {
      areaIds: Array.isArray(candidate.coverage?.areaIds) ? candidate.coverage.areaIds : [],
      center: candidate.coverage?.center || {
        latitude: 0,
        longitude: 0,
      },
      homeVisitRadiusKm:
        typeof candidate.coverage?.homeVisitRadiusKm === 'number' ? candidate.coverage.homeVisitRadiusKm : 0,
    },
    credentials: Array.isArray(candidate.credentials) ? candidate.credentials : [],
    feedbackBreakdown: Array.isArray(candidate.feedbackBreakdown) ? candidate.feedbackBreakdown : [],
    feedbackMetrics: Array.isArray(candidate.feedbackMetrics) ? candidate.feedbackMetrics : [],
    feedbackSummary: candidate.feedbackSummary || {
      recommendationRate: '',
      repeatClientRate: '',
    },
    gallery: Array.isArray(candidate.gallery) ? candidate.gallery : [],
    languages: Array.isArray(candidate.languages) ? candidate.languages : [],
    portfolioEntries: Array.isArray(candidate.portfolioEntries) ? candidate.portfolioEntries : [],
    recentActivities: Array.isArray(candidate.recentActivities) ? candidate.recentActivities : [],
    services: Array.isArray(candidate.services) ? candidate.services : [],
    specialties: Array.isArray(candidate.specialties) ? candidate.specialties : [],
    testimonials: Array.isArray(candidate.testimonials) ? candidate.testimonials : [],
  };
};

export const buildFallbackPublicBootstrapData = (): PublicBootstrapData => ({
  activeHomeFeed: {
    currentUser: EMPTY_CONSUMER,
    featuredAppointment: undefined,
    id: '',
    nearbyProfessionals: [],
    popularServices: [],
    sharedContext: EMPTY_USER_CONTEXT,
    title: '',
  },
  appSectionConfig: {
    homeCategoryIds: [],
  },
  catalog: {
    areas: [],
    categories: [],
    professionals: [],
    services: [],
  },
  currentConsumer: EMPTY_CONSUMER,
  currentUserContext: EMPTY_USER_CONTEXT,
});

export const fetchPublicBootstrapData = async (): Promise<PublicBootstrapData> => {
  const payload = await withTimeout(fetchPublicBootstrap(client), requestTimeoutMs);

  return {
    activeHomeFeed: {
      currentUser: payload.activeHomeFeed.currentUser as ConsumerProfile,
      featuredAppointment: payload.activeHomeFeed.featuredAppointment
        ? {
            appointment: {
              id: payload.activeHomeFeed.featuredAppointment.appointment.id,
              status: payload.activeHomeFeed.featuredAppointment.appointment.status as AppointmentStatus,
            },
            dateLabel: payload.activeHomeFeed.featuredAppointment.dateLabel,
            professional: payload.activeHomeFeed.featuredAppointment.professional as unknown as Professional,
            timeLabel: payload.activeHomeFeed.featuredAppointment.timeLabel,
          }
        : undefined,
      id: payload.activeHomeFeed.id,
      nearbyProfessionals: (payload.activeHomeFeed.nearbyProfessionals ?? []).map(normalizeProfessional),
      popularServices: payload.activeHomeFeed.popularServices as unknown as GlobalService[],
      sharedContext: payload.activeHomeFeed.sharedContext as UserContext,
      title: payload.activeHomeFeed.title,
    },
    appSectionConfig: {
      homeCategoryIds: payload.appSectionConfig.homeCategoryIds ?? [],
    },
    catalog: {
      areas: payload.catalog.areas as Area[],
      categories: payload.catalog.categories as Category[],
      professionals: (payload.catalog.professionals ?? []).map(normalizeProfessional),
      services: payload.catalog.services as unknown as GlobalService[],
    },
    currentConsumer: payload.currentConsumer as ConsumerProfile,
    currentUserContext: payload.currentUserContext as UserContext,
  };
};
