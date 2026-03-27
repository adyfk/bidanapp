'use client';

import {
  createBidanappApiClient,
  saveProfessionalPortalCoverage,
  saveProfessionalPortalGallery,
  saveProfessionalPortalPortfolio,
  saveProfessionalPortalProfile,
  saveProfessionalPortalRequests,
  saveProfessionalPortalServices,
  saveProfessionalPortalTrust,
  upsertAppointmentRecord,
} from '@bidanapp/sdk';
import type {
  ProfessionalLifecycleReviewState,
  ProfessionalManagedActivityStory,
  ProfessionalManagedAppointmentRecord,
  ProfessionalManagedCredential,
  ProfessionalManagedGalleryItem,
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalPortalState,
} from '@/features/professional-portal/lib/contracts';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { PUBLIC_ENV } from '@/lib/env';
import { hasProfessionalAuthSessionHint } from '@/lib/professional-auth-storage';

const requestTimeoutMs = 1500;
const syncWarnings = new Set<string>();
const client = createBidanappApiClient(getBackendApiBaseUrl());

const isApiSyncEnabled = () => PUBLIC_ENV.professionalPortalDataSource === 'api' && typeof window !== 'undefined';
const isAdminPortalSyncEnabled = () => isApiSyncEnabled() && window.location.pathname.startsWith('/admin');

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Professional portal sync timed out')), timeoutMs);

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

const warnSyncFailure = (message: string) => {
  if (!isApiSyncEnabled() || syncWarnings.has(message)) {
    return;
  }

  syncWarnings.add(message);
  console.warn(message);
};

const fireAndForgetSync = (promise: Promise<unknown>, warningMessage: string) => {
  if (!isApiSyncEnabled()) {
    return;
  }

  void withTimeout(promise, requestTimeoutMs).catch(() => {
    warnSyncFailure(warningMessage);
  });
};

const fireAndForgetProtectedSync = (promiseFactory: () => Promise<unknown>, warningMessage: string) => {
  if (!hasProfessionalAuthSessionHint() || !isApiSyncEnabled()) {
    return;
  }

  fireAndForgetSync(promiseFactory(), warningMessage);
};

const fireAndForgetAdminSync = (promiseFactory: () => Promise<unknown>, warningMessage: string) => {
  if (!isAdminPortalSyncEnabled()) {
    return;
  }

  fireAndForgetSync(promiseFactory(), warningMessage);
};

const buildApiUrl = (path: string) => `${getBackendApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

export const syncProfessionalPortalProfileResource = (
  portalState: ProfessionalPortalState,
  reviewState: ProfessionalLifecycleReviewState,
) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalProfile(client, {
        acceptingNewClients: portalState.acceptingNewClients,
        autoApproveInstantBookings: portalState.autoApproveInstantBookings,
        city: portalState.city,
        credentialNumber: portalState.credentialNumber,
        displayName: portalState.displayName,
        phone: portalState.phone,
        professionalId: portalState.activeProfessionalId,
        publicBio: portalState.publicBio,
        responseTimeGoal: portalState.responseTimeGoal,
        reviewState,
        yearsExperience: portalState.yearsExperience,
      }),
    '[ProfessionalPortal] Failed to sync profile resource to the backend.',
  );
};

export const syncProfessionalPortalAdminReviewStateResource = (
  professionalId: string,
  reviewState: ProfessionalLifecycleReviewState,
  options?: {
    acceptingNewClients?: boolean;
  },
) => {
  fireAndForgetAdminSync(async () => {
    const response = await fetch(buildApiUrl('/admin/professionals/review-state'), {
      body: JSON.stringify({
        ...(typeof options?.acceptingNewClients === 'boolean'
          ? { acceptingNewClients: options.acceptingNewClients }
          : {}),
        professionalId,
        reviewState,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error(`[ProfessionalPortal] Admin review sync failed with status ${response.status}.`);
    }
  }, '[ProfessionalPortal] Failed to sync admin review state to the backend.');
};

export const hydrateProfessionalPortalAdminReviewStatesFromApi = async () => {
  if (!isAdminPortalSyncEnabled()) {
    return undefined;
  }

  try {
    const response = await withTimeout(
      fetch(buildApiUrl('/admin/professionals/review-states'), {
        credentials: 'include',
        method: 'GET',
      }),
      requestTimeoutMs,
    );

    if (!response.ok) {
      throw new Error(`[ProfessionalPortal] Admin review-state hydration failed with status ${response.status}.`);
    }

    const body = await response.json();
    return body?.data as
      | {
          reviewStatesByProfessionalId?: Record<string, ProfessionalLifecycleReviewState>;
        }
      | undefined;
  } catch {
    warnSyncFailure('[ProfessionalPortal] Failed to hydrate admin review states from the backend.');
    return undefined;
  }
};

export const syncProfessionalPortalCoverageResource = (portalState: ProfessionalPortalState) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalCoverage(client, {
        acceptingNewClients: portalState.acceptingNewClients,
        autoApproveInstantBookings: portalState.autoApproveInstantBookings,
        availabilityRulesByMode: portalState.availabilityRulesByMode ?? {},
        city: portalState.city,
        coverageAreaIds: portalState.coverageAreaIds,
        coverageCenter: portalState.coverageCenter,
        homeVisitRadiusKm: portalState.homeVisitRadiusKm,
        practiceAddress: portalState.practiceAddress,
        practiceLabel: portalState.practiceLabel,
        professionalId: portalState.activeProfessionalId,
        publicBio: portalState.publicBio,
        responseTimeGoal: portalState.responseTimeGoal,
      }),
    '[ProfessionalPortal] Failed to sync coverage resource to the backend.',
  );
};

export const syncProfessionalPortalServicesResource = (
  professionalId: string,
  serviceConfigurations: ProfessionalManagedService[],
) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalServices(client, {
        professionalId,
        serviceConfigurations,
      }),
    '[ProfessionalPortal] Failed to sync services resource to the backend.',
  );
};

export const syncProfessionalPortalPortfolioResource = (
  professionalId: string,
  portfolioEntries: ProfessionalManagedPortfolioEntry[],
) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalPortfolio(client, {
        portfolioEntries,
        professionalId,
      }),
    '[ProfessionalPortal] Failed to sync portfolio resource to the backend.',
  );
};

export const syncProfessionalPortalGalleryResource = (
  professionalId: string,
  galleryItems: ProfessionalManagedGalleryItem[],
) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalGallery(client, {
        galleryItems,
        professionalId,
      }),
    '[ProfessionalPortal] Failed to sync gallery resource to the backend.',
  );
};

export const syncProfessionalPortalTrustResource = (
  professionalId: string,
  credentials: ProfessionalManagedCredential[],
  activityStories: ProfessionalManagedActivityStory[],
) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalTrust(client, {
        activityStories,
        credentials,
        professionalId,
      }),
    '[ProfessionalPortal] Failed to sync trust resource to the backend.',
  );
};

export const syncProfessionalPortalRequestsResource = (
  professionalId: string,
  appointmentRecords: ProfessionalManagedAppointmentRecord[],
) => {
  fireAndForgetProtectedSync(
    () =>
      saveProfessionalPortalRequests(client, {
        appointmentRecords,
        professionalId,
      }),
    '[ProfessionalPortal] Failed to sync request records to the backend.',
  );
};

export const syncAppointmentRecordResource = (
  professionalId: string,
  appointmentRecord: ProfessionalManagedAppointmentRecord,
) => {
  fireAndForgetSync(
    upsertAppointmentRecord(client, appointmentRecord.id, {
      appointmentRecord,
      professionalId,
    }),
    '[Appointments] Failed to sync appointment record to the backend.',
  );
};
