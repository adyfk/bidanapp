import { createBidanappApiClient, fetchPublicBootstrap } from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { normalizeProfessional } from '@/lib/catalog-normalizers';
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

export const buildEmptyPublicBootstrapData = (): PublicBootstrapData => ({
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
            professional: normalizeProfessional(payload.activeHomeFeed.featuredAppointment.professional),
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
