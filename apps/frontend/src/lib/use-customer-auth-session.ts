'use client';

import { useEffect, useState } from 'react';
import {
  hydrateCustomerAuthSessionFromApi,
  loginCustomerWithApi,
  logoutCustomerFromApi,
  registerCustomerWithApi,
  syncCustomerAuthAccountToApi,
  syncCustomerAuthPasswordToApi,
} from '@/lib/customer-auth-api';
import { subscribeCustomerAuthSessionHint } from '@/lib/customer-auth-storage';
import { cleanupCustomerPushSubscription } from '@/lib/customer-push';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { CustomerAuthSessionState } from '@/types/customer-auth';

const customerAuthSessionEventName = 'bidanapp:customer-auth-session-change';

const defaultCustomerAuthSession: CustomerAuthSessionState = {
  consumerId: '',
  displayName: '',
  isAuthenticated: false,
  phone: '',
};
let cachedCustomerAuthSession = defaultCustomerAuthSession;

const buildLoggedOutSession = (value?: Partial<CustomerAuthSessionState>): CustomerAuthSessionState => ({
  city: value?.city,
  consumerId: value?.consumerId || '',
  displayName: value?.displayName || '',
  expiresAt: value?.expiresAt,
  isAuthenticated: false,
  lastLoginAt: value?.lastLoginAt,
  phone: value?.phone || '',
  registeredAt: value?.registeredAt,
});

const normalizeSession = (value: Partial<CustomerAuthSessionState>): CustomerAuthSessionState =>
  !value.isAuthenticated || !value.consumerId || !value.phone
    ? buildLoggedOutSession(value)
    : {
        city: value.city || '',
        consumerId: value.consumerId,
        displayName: value.displayName || '',
        expiresAt: value.expiresAt,
        isAuthenticated: true,
        lastLoginAt: value.lastLoginAt,
        phone: value.phone,
        registeredAt: value.registeredAt,
      };

const notifyCustomerAuthSessionChange = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(customerAuthSessionEventName));
};

export const readCachedCustomerAuthSession = () => cachedCustomerAuthSession;

export const writeCachedCustomerAuthSession = (nextSession: CustomerAuthSessionState) => {
  cachedCustomerAuthSession = nextSession;
  notifyCustomerAuthSessionChange();
};

export const subscribeCustomerAuthSession = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(customerAuthSessionEventName, listener);

  return () => {
    window.removeEventListener(customerAuthSessionEventName, listener);
  };
};

export const useCustomerAuthSession = () => {
  const { continueAsCustomer, continueAsVisitor, isCustomer } = useViewerSession();
  const [session, setSession] = useState<CustomerAuthSessionState>(() => readCachedCustomerAuthSession());
  const [hasHydratedSession, setHasHydratedSession] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: customer auth hydration should run once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSession = () => {
      setSession(readCachedCustomerAuthSession());
    };

    const hydrateFromBackend = async () => {
      const apiState = await hydrateCustomerAuthSessionFromApi();
      if (!apiState) {
        const nextSession = buildLoggedOutSession(readCachedCustomerAuthSession());
        setSession(nextSession);
        writeCachedCustomerAuthSession(nextSession);
        if (isCustomer) {
          continueAsVisitor();
        }
        setHasHydratedSession(true);
        return;
      }

      const nextSession = normalizeSession(apiState);
      setSession(nextSession);
      writeCachedCustomerAuthSession(nextSession);
      if (!isCustomer) {
        continueAsCustomer();
      }
      setHasHydratedSession(true);
    };

    syncSession();
    const unsubscribeSession = subscribeCustomerAuthSession(syncSession);
    const unsubscribeAuth = subscribeCustomerAuthSessionHint(syncSession);

    void hydrateFromBackend();

    return () => {
      unsubscribeSession();
      unsubscribeAuth();
    };
  }, []);

  const updateSession = (nextSession: CustomerAuthSessionState) => {
    setSession(nextSession);
    writeCachedCustomerAuthSession(nextSession);
  };

  const login = async (input: { password: string; phone: string }) => {
    const apiSession = await loginCustomerWithApi(input);
    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    continueAsCustomer();
    return nextSession;
  };

  const register = async (input: { city?: string; displayName: string; password: string; phone: string }) => {
    const apiSession = await registerCustomerWithApi(input);
    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    continueAsCustomer();
    return nextSession;
  };

  const logout = async () => {
    if (session.isAuthenticated) {
      await cleanupCustomerPushSubscription();
    }
    await logoutCustomerFromApi();
    updateSession(buildLoggedOutSession(session));
    continueAsVisitor();
  };

  const updateAccount = async (input: { city?: string; displayName: string; phone: string }) => {
    const apiSession = await syncCustomerAuthAccountToApi(input);
    if (!apiSession) {
      return undefined;
    }

    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    return nextSession;
  };

  const updatePassword = async (input: { currentPassword: string; newPassword: string }) => {
    const apiSession = await syncCustomerAuthPasswordToApi(input);
    if (!apiSession) {
      return undefined;
    }

    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    return nextSession;
  };

  return {
    hasHydrated: hasHydratedSession,
    isAuthenticated: session.isAuthenticated,
    login,
    logout,
    register,
    session,
    updateAccount,
    updatePassword,
  };
};
