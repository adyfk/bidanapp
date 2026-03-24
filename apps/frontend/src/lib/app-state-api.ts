'use client';

import type {
  AdminConsoleState,
  AdminConsoleTableInput,
  ConsumerPreferencesState,
  CustomerNotificationState,
  ProfessionalNotificationState,
  SupportDeskState,
  ViewerSessionState,
} from '@bidanapp/sdk';
import {
  createBidanappApiClient,
  fetchAdminConsoleState,
  fetchAdminConsoleTableState,
  fetchConsumerPreferencesState,
  fetchCustomerNotificationState,
  fetchProfessionalNotificationState,
  fetchSupportDeskState,
  fetchViewerSessionState,
  saveAdminConsoleState,
  saveAdminConsoleTableState,
  saveConsumerPreferencesState,
  saveCustomerNotificationState,
  saveProfessionalNotificationState,
  saveSupportDeskState,
  saveViewerSessionState,
} from '@bidanapp/sdk';
import { hasAdminAuthSessionHint } from '@/lib/admin-auth-storage';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { hasCustomerAuthSessionHint } from '@/lib/customer-auth-storage';
import { PUBLIC_ENV } from '@/lib/env';
import { hasProfessionalAuthSessionHint } from '@/lib/professional-auth-storage';

const requestTimeoutMs = 1500;
const syncWarnings = new Set<string>();
const client = createBidanappApiClient(getBackendApiBaseUrl());

const isAppStateApiEnabled = () => PUBLIC_ENV.appStateDataSource === 'api' && typeof window !== 'undefined';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('App state sync timed out')), timeoutMs);

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
  if (!isAppStateApiEnabled() || syncWarnings.has(message)) {
    return;
  }

  syncWarnings.add(message);
  console.warn(message);
};

const loadFromApi = async <T>(promise: Promise<T>, warningMessage: string) => {
  if (!isAppStateApiEnabled()) {
    return undefined;
  }

  try {
    return await withTimeout(promise, requestTimeoutMs);
  } catch {
    warnSyncFailure(warningMessage);
    return undefined;
  }
};

const fireAndForgetSync = (promise: Promise<unknown>, warningMessage: string) => {
  if (!isAppStateApiEnabled()) {
    return;
  }

  void withTimeout(promise, requestTimeoutMs).catch(() => {
    warnSyncFailure(warningMessage);
  });
};

const loadAdminFromApi = async <T>(promiseFactory: () => Promise<T>, warningMessage: string) => {
  if (!hasAdminAuthSessionHint() || !isAppStateApiEnabled()) {
    return undefined;
  }

  try {
    return await withTimeout(promiseFactory(), requestTimeoutMs);
  } catch {
    warnSyncFailure(warningMessage);
    return undefined;
  }
};

const fireAndForgetAdminSync = (promiseFactory: () => Promise<unknown>, warningMessage: string) => {
  if (!hasAdminAuthSessionHint() || !isAppStateApiEnabled()) {
    return;
  }

  void withTimeout(promiseFactory(), requestTimeoutMs).catch(() => {
    warnSyncFailure(warningMessage);
  });
};

const loadCustomerFromApi = async <T>(promiseFactory: () => Promise<T>, warningMessage: string) => {
  if (!hasCustomerAuthSessionHint() || !isAppStateApiEnabled()) {
    return undefined;
  }

  try {
    return await withTimeout(promiseFactory(), requestTimeoutMs);
  } catch {
    warnSyncFailure(warningMessage);
    return undefined;
  }
};

const fireAndForgetCustomerSync = (promiseFactory: () => Promise<unknown>, warningMessage: string) => {
  if (!hasCustomerAuthSessionHint() || !isAppStateApiEnabled()) {
    return;
  }

  void withTimeout(promiseFactory(), requestTimeoutMs).catch(() => {
    warnSyncFailure(warningMessage);
  });
};

const loadProfessionalFromApi = async <T>(promiseFactory: () => Promise<T>, warningMessage: string) => {
  if (!hasProfessionalAuthSessionHint() || !isAppStateApiEnabled()) {
    return undefined;
  }

  try {
    return await withTimeout(promiseFactory(), requestTimeoutMs);
  } catch {
    warnSyncFailure(warningMessage);
    return undefined;
  }
};

const fireAndForgetProfessionalSync = (promiseFactory: () => Promise<unknown>, warningMessage: string) => {
  if (!hasProfessionalAuthSessionHint() || !isAppStateApiEnabled()) {
    return;
  }

  void withTimeout(promiseFactory(), requestTimeoutMs).catch(() => {
    warnSyncFailure(warningMessage);
  });
};

export const hydrateViewerSessionFromApi = () =>
  loadFromApi(fetchViewerSessionState(client), '[AppState] Failed to hydrate viewer session from the backend.');

export const syncViewerSessionToApi = (state: ViewerSessionState) => {
  fireAndForgetSync(saveViewerSessionState(client, state), '[AppState] Failed to sync viewer session to the backend.');
};

export const hydrateCustomerNotificationStateFromApi = () =>
  loadCustomerFromApi(
    () => fetchCustomerNotificationState(client),
    '[AppState] Failed to hydrate customer notification state from the backend.',
  );

export const syncCustomerNotificationStateToApi = (state: CustomerNotificationState) => {
  fireAndForgetCustomerSync(
    () => saveCustomerNotificationState(client, state),
    '[AppState] Failed to sync customer notification state to the backend.',
  );
};

export const hydrateProfessionalNotificationStateFromApi = (professionalId?: string) =>
  loadProfessionalFromApi(
    () => fetchProfessionalNotificationState(client, professionalId),
    '[AppState] Failed to hydrate professional notification state from the backend.',
  );

export const syncProfessionalNotificationStateToApi = (
  state: ProfessionalNotificationState,
  professionalId?: string,
) => {
  fireAndForgetProfessionalSync(
    () => saveProfessionalNotificationState(client, state, professionalId),
    '[AppState] Failed to sync professional notification state to the backend.',
  );
};

export const hydrateConsumerPreferencesFromApi = (consumerId?: string) =>
  loadCustomerFromApi(
    () => fetchConsumerPreferencesState(client, consumerId),
    '[AppState] Failed to hydrate consumer preferences from the backend.',
  );

export const syncConsumerPreferencesToApi = (state: ConsumerPreferencesState, consumerId?: string) => {
  fireAndForgetCustomerSync(
    () => saveConsumerPreferencesState(client, state, consumerId),
    '[AppState] Failed to sync consumer preferences to the backend.',
  );
};

export const hydrateSupportDeskFromApi = () =>
  loadAdminFromApi(() => fetchSupportDeskState(client), '[AppState] Failed to hydrate support desk from the backend.');

export const syncSupportDeskToApi = (state: SupportDeskState) => {
  fireAndForgetAdminSync(
    () => saveSupportDeskState(client, state),
    '[AppState] Failed to sync support desk to the backend.',
  );
};

export const hydrateAdminConsoleFromApi = () =>
  loadAdminFromApi(
    () => fetchAdminConsoleState(client),
    '[AppState] Failed to hydrate admin console from the backend.',
  );

export const hydrateAdminConsoleTableFromApi = (tableName: string) =>
  loadAdminFromApi(
    () => fetchAdminConsoleTableState(client, tableName),
    `[AppState] Failed to hydrate admin console table "${tableName}" from the backend.`,
  );

export const syncAdminConsoleToApi = (state: {
  savedAt?: string;
  schemaVersion: number;
  tables: Record<string, Array<Record<string, unknown>> | null>;
}) => {
  fireAndForgetAdminSync(
    () => saveAdminConsoleState(client, state as AdminConsoleState),
    '[AppState] Failed to sync admin console to the backend.',
  );
};

export const syncAdminConsoleTableToApi = (
  tableName: string,
  state: {
    savedAt?: string;
    schemaVersion: number;
    rows: Array<Record<string, unknown>> | null;
  },
) => {
  fireAndForgetAdminSync(
    () => saveAdminConsoleTableState(client, tableName, state as AdminConsoleTableInput),
    `[AppState] Failed to sync admin console table "${tableName}" to the backend.`,
  );
};
