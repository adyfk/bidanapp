'use client';

import {
  createBidanappApiClient,
  createProfessionalAuthSession,
  deleteProfessionalAuthSession,
  fetchProfessionalAuthSession,
  registerProfessionalAuthAccount,
  requestProfessionalPasswordRecovery,
  updateProfessionalAuthAccount,
  updateProfessionalAuthPassword,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { clearProfessionalAuthSessionHint, markProfessionalAuthSessionHint } from '@/lib/professional-auth-storage';

const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Professional auth request timed out')), timeoutMs);

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

export const loginProfessionalWithApi = async (input: { password: string; phone: string; professionalId: string }) => {
  const response = await withTimeout(createProfessionalAuthSession(client, input), requestTimeoutMs);
  markProfessionalAuthSessionHint(true);
  return response;
};

export const registerProfessionalWithApi = async (input: {
  city?: string;
  credentialNumber: string;
  displayName: string;
  password: string;
  phone: string;
  professionalId: string;
}) => {
  const response = await withTimeout(
    registerProfessionalAuthAccount(client, {
      city: input.city?.trim() || '',
      credentialNumber: input.credentialNumber,
      displayName: input.displayName,
      password: input.password,
      phone: input.phone,
      professionalId: input.professionalId,
    }),
    requestTimeoutMs,
  );
  markProfessionalAuthSessionHint(true);
  return response;
};

export const hydrateProfessionalAuthSessionFromApi = async () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const session = await withTimeout(fetchProfessionalAuthSession(client), requestTimeoutMs);
    markProfessionalAuthSessionHint(true);
    return session;
  } catch {
    clearProfessionalAuthSessionHint();
    return undefined;
  }
};

export const syncProfessionalAuthAccountToApi = async (input: {
  city?: string;
  credentialNumber: string;
  displayName: string;
  phone: string;
}) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return withTimeout(updateProfessionalAuthAccount(client, input), requestTimeoutMs);
};

export const syncProfessionalAuthPasswordToApi = async (input: { currentPassword: string; newPassword: string }) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return withTimeout(updateProfessionalAuthPassword(client, input), requestTimeoutMs);
};

export const requestProfessionalPasswordRecoveryFromApi = async (input: { phone: string; professionalId: string }) => {
  return withTimeout(requestProfessionalPasswordRecovery(client, input), requestTimeoutMs);
};

export const logoutProfessionalFromApi = async () => {
  clearProfessionalAuthSessionHint();
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return await withTimeout(deleteProfessionalAuthSession(client), requestTimeoutMs);
  } catch {
    return undefined;
  }
};
