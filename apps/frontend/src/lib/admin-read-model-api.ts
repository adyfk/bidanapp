'use client';

import {
  type AppointmentReadModel,
  type CatalogReadModel,
  createBidanappApiClient,
  fetchAppointmentReadModel,
  fetchCatalogReadModel,
  fetchPublicBootstrap,
  type PublicBootstrap,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { getProfessionalCategoryLabel } from '@/lib/catalog-selectors';
import type { Category, GlobalService, Professional } from '@/types/catalog';
import type {
  AppointmentRow,
  AppRuntimeSelectionRow,
  ConsumerRow,
  HomeFeedSnapshotRow,
  ProfessionalRow,
  ProfessionalServiceOfferingRow,
  UserContextRow,
} from '@/types/seed-data';

const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Admin read model request timed out')), timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

export interface AdminConsoleReadModelSnapshot {
  appRuntimeSelections: AppRuntimeSelectionRow[];
  appointments: AppointmentRow[];
  consumers: ConsumerRow[];
  homeFeedSnapshots: HomeFeedSnapshotRow[];
  professionalServiceOfferings: ProfessionalServiceOfferingRow[];
  professionals: ProfessionalRow[];
  serviceCategories: Category[];
  services: GlobalService[];
  userContexts: UserContextRow[];
}

const toProfessionalRows = (
  professionals: Professional[],
  categories: Category[],
  services: GlobalService[],
): ProfessionalRow[] =>
  professionals.map((professional, index) => ({
    about: professional.about,
    badgeLabel: professional.badgeLabel,
    clientsServed: professional.clientsServed,
    coverImage: professional.coverImage || null,
    experience: professional.experience,
    gender: professional.gender,
    id: professional.id,
    image: professional.image,
    index: index + 1,
    isAvailable: professional.availability.isAvailable,
    location: professional.location,
    name: professional.name,
    rating: professional.rating,
    responseTime: professional.responseTime,
    reviews: professional.reviews,
    slug: professional.slug,
    title:
      getProfessionalCategoryLabel({
        categories,
        professional,
        services,
      }) || professional.title,
  }));

const toProfessionalServiceOfferingRows = (professionals: Professional[]): ProfessionalServiceOfferingRow[] =>
  professionals.flatMap((professional) =>
    professional.services.map((service, index) => ({
      bookingFlow: service.bookingFlow,
      defaultMode: service.defaultMode,
      duration: service.duration,
      id: service.id,
      index: index + 1,
      price: service.price,
      professionalId: professional.id,
      serviceId: service.serviceId,
      summary: service.summary || null,
      supportsHomeVisit: service.serviceModes.homeVisit,
      supportsOnline: service.serviceModes.online,
      supportsOnsite: service.serviceModes.onsite,
    })),
  );

const toConsumerRows = (bootstrap: PublicBootstrap): ConsumerRow[] =>
  bootstrap.currentConsumer?.id
    ? [
        {
          avatar: bootstrap.currentConsumer.avatar,
          id: bootstrap.currentConsumer.id,
          index: 1,
          name: bootstrap.currentConsumer.name,
          phone: bootstrap.currentConsumer.phone,
        },
      ]
    : [];

const toUserContextRows = (bootstrap: PublicBootstrap): UserContextRow[] =>
  bootstrap.currentUserContext?.id
    ? [
        {
          id: bootstrap.currentUserContext.id,
          index: 1,
          onlineStatusLabel: bootstrap.currentUserContext.onlineStatusLabel,
          selectedAreaId: bootstrap.currentUserContext.area?.id || '',
          userLatitude: bootstrap.currentUserContext.userLocation?.latitude || 0,
          userLongitude: bootstrap.currentUserContext.userLocation?.longitude || 0,
        },
      ]
    : [];

const toHomeFeedRows = (bootstrap: PublicBootstrap): HomeFeedSnapshotRow[] =>
  bootstrap.activeHomeFeed?.id && bootstrap.currentConsumer?.id && bootstrap.currentUserContext?.id
    ? [
        {
          consumerId: bootstrap.currentConsumer.id,
          id: bootstrap.activeHomeFeed.id,
          index: 1,
          title: bootstrap.activeHomeFeed.title,
          userContextId: bootstrap.currentUserContext.id,
        },
      ]
    : [];

const toRuntimeSelectionRows = (bootstrap: PublicBootstrap): AppRuntimeSelectionRow[] =>
  bootstrap.currentConsumer?.id && bootstrap.currentUserContext?.id && bootstrap.activeHomeFeed?.id
    ? [
        {
          activeHomeFeedId: bootstrap.activeHomeFeed.id,
          activeMediaPresetId: 'default',
          currentConsumerId: bootstrap.currentConsumer.id,
          currentDateTimeIso: new Date().toISOString(),
          currentUserContextId: bootstrap.currentUserContext.id,
          id: 'runtime-default',
          index: 1,
        },
      ]
    : [];

const toAdminConsoleReadModelSnapshot = (
  catalog: CatalogReadModel,
  appointments: AppointmentReadModel,
  bootstrap: PublicBootstrap,
): AdminConsoleReadModelSnapshot => {
  const serviceCategories = (catalog.categories ?? []) as Category[];
  const services = (catalog.services ?? []) as GlobalService[];
  const professionals = (catalog.professionals ?? []) as unknown as Professional[];

  return {
    appRuntimeSelections: toRuntimeSelectionRows(bootstrap),
    appointments: (appointments.appointments ?? []) as unknown as AppointmentRow[],
    consumers: toConsumerRows(bootstrap),
    homeFeedSnapshots: toHomeFeedRows(bootstrap),
    professionalServiceOfferings: toProfessionalServiceOfferingRows(professionals),
    professionals: toProfessionalRows(professionals, serviceCategories, services),
    serviceCategories,
    services,
    userContexts: toUserContextRows(bootstrap),
  };
};

export const hydrateAdminConsoleReadModelFromApi = async (): Promise<AdminConsoleReadModelSnapshot | undefined> => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const [catalog, appointments, bootstrap] = await withTimeout(
      Promise.all([fetchCatalogReadModel(client), fetchAppointmentReadModel(client), fetchPublicBootstrap(client)]),
      requestTimeoutMs,
    );

    return toAdminConsoleReadModelSnapshot(catalog, appointments, bootstrap);
  } catch {
    return undefined;
  }
};
