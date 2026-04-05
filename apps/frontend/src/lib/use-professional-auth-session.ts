'use client';

import { useEffect, useState } from 'react';
import {
  hydrateProfessionalAuthSessionFromApi,
  loginProfessionalWithApi,
  logoutProfessionalFromApi,
  registerProfessionalWithApi,
  requestProfessionalPasswordRecoveryFromApi,
  syncProfessionalAuthAccountToApi,
  syncProfessionalAuthPasswordToApi,
} from '@/lib/professional-auth-api';
import { subscribeProfessionalAuthSessionHint } from '@/lib/professional-auth-storage';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { ProfessionalAuthSessionState } from '@/types/professional-auth';

const professionalAuthSessionEventName = 'bidanapp:professional-auth-session-change';

const defaultProfessionalAuthSession: ProfessionalAuthSessionState = {
  displayName: '',
  isAuthenticated: false,
  phone: '',
  professionalId: '',
};
let cachedProfessionalAuthSession = defaultProfessionalAuthSession;

const buildLoggedOutSession = (value?: Partial<ProfessionalAuthSessionState>): ProfessionalAuthSessionState => ({
  city: value?.city,
  credentialNumber: value?.credentialNumber,
  displayName: value?.displayName || '',
  expiresAt: value?.expiresAt,
  isAuthenticated: false,
  lastLoginAt: value?.lastLoginAt,
  phone: value?.phone || '',
  professionalId: value?.professionalId || '',
  registeredAt: value?.registeredAt,
});

const normalizeSession = (value: Partial<ProfessionalAuthSessionState>): ProfessionalAuthSessionState =>
  !value.isAuthenticated || !value.professionalId || !value.phone
    ? buildLoggedOutSession(value)
    : {
        city: value.city || '',
        credentialNumber: value.credentialNumber || '',
        displayName: value.displayName || '',
        expiresAt: value.expiresAt,
        isAuthenticated: true,
        lastLoginAt: value.lastLoginAt,
        phone: value.phone,
        professionalId: value.professionalId,
        registeredAt: value.registeredAt,
      };

const notifyProfessionalAuthSessionChange = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(professionalAuthSessionEventName));
};

const readProfessionalAuthSession = () => cachedProfessionalAuthSession;

const writeProfessionalAuthSession = (nextSession: ProfessionalAuthSessionState) => {
  cachedProfessionalAuthSession = nextSession;
  notifyProfessionalAuthSessionChange();
};

const subscribeProfessionalAuthSession = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(professionalAuthSessionEventName, listener);

  return () => {
    window.removeEventListener(professionalAuthSessionEventName, listener);
  };
};

export const useProfessionalAuthSession = () => {
  const { continueAsProfessional, continueAsVisitor, isProfessional } = useViewerSession();
  const [session, setSession] = useState<ProfessionalAuthSessionState>(() => readProfessionalAuthSession());
  const [hasHydratedSession, setHasHydratedSession] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: professional auth hydration should run once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSession = () => {
      setSession(readProfessionalAuthSession());
    };

    const hydrateFromBackend = async () => {
      const apiState = await hydrateProfessionalAuthSessionFromApi();
      if (!apiState) {
        const nextSession = buildLoggedOutSession(readProfessionalAuthSession());
        setSession(nextSession);
        writeProfessionalAuthSession(nextSession);
        if (isProfessional) {
          continueAsVisitor();
        }
        setHasHydratedSession(true);
        return;
      }

      const nextSession = normalizeSession(apiState);
      setSession(nextSession);
      writeProfessionalAuthSession(nextSession);
      if (!isProfessional) {
        continueAsProfessional();
      }
      setHasHydratedSession(true);
    };

    syncSession();
    const unsubscribeSession = subscribeProfessionalAuthSession(syncSession);
    const unsubscribeAuth = subscribeProfessionalAuthSessionHint(syncSession);

    void hydrateFromBackend();

    return () => {
      unsubscribeSession();
      unsubscribeAuth();
    };
  }, []);

  const updateSession = (nextSession: ProfessionalAuthSessionState) => {
    setSession(nextSession);
    writeProfessionalAuthSession(nextSession);
  };

  const login = async (input: { password: string; phone: string; professionalId: string }) => {
    const apiSession = await loginProfessionalWithApi(input);
    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    continueAsProfessional();
    return nextSession;
  };

  const register = async (input: {
    city?: string;
    credentialNumber: string;
    displayName: string;
    password: string;
    phone: string;
    professionalId?: string;
  }) => {
    const apiSession = await registerProfessionalWithApi(input);
    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    continueAsProfessional();
    return nextSession;
  };

  const logout = async () => {
    await logoutProfessionalFromApi();
    updateSession(buildLoggedOutSession(session));
    continueAsVisitor();
  };

  const updateAccount = async (input: {
    city?: string;
    credentialNumber: string;
    displayName: string;
    phone: string;
  }) => {
    const apiSession = await syncProfessionalAuthAccountToApi(input);
    if (!apiSession) {
      return undefined;
    }

    const nextSession = normalizeSession(apiSession);
    updateSession(nextSession);
    return nextSession;
  };

  const updatePassword = async (input: { currentPassword: string; newPassword: string }) => {
    const apiSession = await syncProfessionalAuthPasswordToApi(input);
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
    requestPasswordRecovery: requestProfessionalPasswordRecoveryFromApi,
    session,
    updateAccount,
    updatePassword,
  };
};
