'use client';

import {
  createAdminAuthSession,
  createBidanappApiClient,
  deleteAdminAuthSession,
  fetchAdminAuthSession,
  updateAdminAuthSession,
} from '@bidanapp/sdk';
import { clearAdminAuthSessionHint, markAdminAuthSessionHint } from '@/lib/admin-auth-storage';
import { getBackendApiBaseUrl } from '@/lib/backend';

const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Admin auth request timed out')), timeoutMs);

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

export const loginAdminWithApi = async (email: string, password: string) => {
  const response = await withTimeout(
    createAdminAuthSession(client, {
      email,
      password,
    }),
    requestTimeoutMs,
  );

  markAdminAuthSessionHint(true);
  return response;
};

export const hydrateAdminAuthSessionFromApi = async () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const session = await withTimeout(fetchAdminAuthSession(client), requestTimeoutMs);
    markAdminAuthSessionHint(true);
    return session;
  } catch {
    clearAdminAuthSessionHint();
    return undefined;
  }
};

export const syncAdminAuthSessionMetadataToApi = async (lastVisitedRoute?: string) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return await withTimeout(
      updateAdminAuthSession(client, {
        lastVisitedRoute: lastVisitedRoute?.trim() || '',
      }),
      requestTimeoutMs,
    );
  } catch {
    return undefined;
  }
};

export const logoutAdminFromApi = async () => {
  clearAdminAuthSessionHint();
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return await withTimeout(deleteAdminAuthSession(client), requestTimeoutMs);
  } catch {
    return undefined;
  }
};
