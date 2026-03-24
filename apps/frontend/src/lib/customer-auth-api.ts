'use client';

import {
  createBidanappApiClient,
  createCustomerAuthSession,
  deleteCustomerAuthSession,
  fetchCustomerAuthSession,
  registerCustomerAuthAccount,
  updateCustomerAuthAccount,
  updateCustomerAuthPassword,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { clearCustomerAuthSessionHint, markCustomerAuthSessionHint } from '@/lib/customer-auth-storage';

const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Customer auth request timed out')), timeoutMs);

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

export const loginCustomerWithApi = async (input: { password: string; phone: string }) => {
  const response = await withTimeout(createCustomerAuthSession(client, input), requestTimeoutMs);
  markCustomerAuthSessionHint(true);
  return response;
};

export const registerCustomerWithApi = async (input: {
  city?: string;
  displayName: string;
  password: string;
  phone: string;
}) => {
  const response = await withTimeout(
    registerCustomerAuthAccount(client, {
      city: input.city?.trim() || '',
      displayName: input.displayName,
      password: input.password,
      phone: input.phone,
    }),
    requestTimeoutMs,
  );
  markCustomerAuthSessionHint(true);
  return response;
};

export const hydrateCustomerAuthSessionFromApi = async () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const session = await withTimeout(fetchCustomerAuthSession(client), requestTimeoutMs);
    markCustomerAuthSessionHint(true);
    return session;
  } catch {
    clearCustomerAuthSessionHint();
    return undefined;
  }
};

export const syncCustomerAuthAccountToApi = async (input: { city?: string; displayName: string; phone: string }) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return withTimeout(updateCustomerAuthAccount(client, input), requestTimeoutMs);
};

export const syncCustomerAuthPasswordToApi = async (input: { currentPassword: string; newPassword: string }) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return withTimeout(updateCustomerAuthPassword(client, input), requestTimeoutMs);
};

export const logoutCustomerFromApi = async () => {
  clearCustomerAuthSessionHint();
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return await withTimeout(deleteCustomerAuthSession(client), requestTimeoutMs);
  } catch {
    return undefined;
  }
};
