'use client';

import { useEffect, useState } from 'react';
import {
  hydrateAdminAuthSessionFromApi,
  loginAdminWithApi,
  logoutAdminFromApi,
  syncAdminAuthSessionMetadataToApi,
} from '@/lib/admin-auth-api';
import { subscribeAdminAuthSessionHint } from '@/lib/admin-auth-storage';
import { useAdminDirectory } from '@/lib/use-admin-directory';
import type { AdminSessionState } from '@/types/admin';
import { clearAdminConsoleSnapshotCache } from './useAdminConsoleData';
import { clearSupportDeskSnapshotCache } from './useSupportDesk';

const adminSessionEventName = 'bidanapp:admin-session-change';

const defaultAdminSession: AdminSessionState = {
  adminId: '',
  email: '',
  focusArea: 'support',
  isAuthenticated: false,
};
let cachedAdminSession = defaultAdminSession;

const buildLoggedOutSession = (value?: Partial<AdminSessionState>): AdminSessionState => ({
  adminId: '',
  email: '',
  expiresAt: value?.expiresAt,
  focusArea: value?.focusArea || 'support',
  isAuthenticated: false,
  lastLoginAt: value?.lastLoginAt,
  lastVisitedRoute: value?.lastVisitedRoute,
});

const normalizeFocusArea = (value: unknown): AdminSessionState['focusArea'] =>
  value === 'catalog' || value === 'ops' || value === 'reviews' || value === 'support' ? value : 'support';

type NormalizableAdminSession = Partial<Omit<AdminSessionState, 'focusArea'>> & {
  focusArea?: AdminSessionState['focusArea'] | string;
};

const normalizeSession = (value: NormalizableAdminSession): AdminSessionState =>
  !value.isAuthenticated || !value.adminId || !value.email
    ? buildLoggedOutSession({
        expiresAt: value.expiresAt,
        focusArea: normalizeFocusArea(value.focusArea),
        lastLoginAt: value.lastLoginAt || undefined,
        lastVisitedRoute: value.lastVisitedRoute || undefined,
      })
    : {
        adminId: value.adminId,
        email: value.email,
        expiresAt: value.expiresAt || undefined,
        focusArea: normalizeFocusArea(value.focusArea),
        isAuthenticated: true,
        lastLoginAt: value.lastLoginAt || undefined,
        lastVisitedRoute: value.lastVisitedRoute || undefined,
      };

const readAdminSession = () => cachedAdminSession;

const writeAdminSession = (nextSession: AdminSessionState) => {
  cachedAdminSession = nextSession;

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(adminSessionEventName));
};

const clearAdminWorkspaceState = () => {
  clearAdminConsoleSnapshotCache();
  clearSupportDeskSnapshotCache();
};

export const useAdminSession = () => {
  const { adminStaff, hasHydrated: hasHydratedDirectory } = useAdminDirectory();
  const [session, setSession] = useState<AdminSessionState>(() => readAdminSession());
  const [hasHydratedSession, setHasHydratedSession] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSession = () => {
      setSession(readAdminSession());
    };

    const hydrateFromBackend = async () => {
      const apiState = await hydrateAdminAuthSessionFromApi();
      if (!apiState) {
        const nextSession = buildLoggedOutSession(readAdminSession());
        clearAdminWorkspaceState();
        setSession(nextSession);
        writeAdminSession(nextSession);
        setHasHydratedSession(true);
        return;
      }

      const nextSession = normalizeSession(apiState);
      setSession(nextSession);
      writeAdminSession(nextSession);
      setHasHydratedSession(true);
    };

    syncSession();
    window.addEventListener(adminSessionEventName, syncSession);
    const unsubscribeAuth = subscribeAdminAuthSessionHint(syncSession);

    void hydrateFromBackend();

    return () => {
      window.removeEventListener(adminSessionEventName, syncSession);
      unsubscribeAuth();
    };
  }, []);

  const activeAdmin = adminStaff.find((admin) => admin.id === session.adminId || admin.email === session.email) || null;

  const updateSession = (nextSession: AdminSessionState) => {
    setSession(nextSession);
    writeAdminSession(nextSession);
  };

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      const apiSession = await loginAdminWithApi(email.trim().toLowerCase(), password);
      clearAdminWorkspaceState();
      updateSession(
        normalizeSession({
          ...apiSession,
          lastVisitedRoute: session.lastVisitedRoute,
        }),
      );
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await logoutAdminFromApi();
    clearAdminWorkspaceState();
    updateSession(
      buildLoggedOutSession({
        expiresAt: session.expiresAt,
        focusArea: session.focusArea,
        lastLoginAt: session.lastLoginAt,
        lastVisitedRoute: session.lastVisitedRoute,
      }),
    );
  };

  const setLastVisitedRoute = (route: string) => {
    if (!session.isAuthenticated || session.lastVisitedRoute === route) {
      return;
    }

    const nextSession = {
      ...session,
      lastVisitedRoute: route,
    } satisfies AdminSessionState;
    updateSession(nextSession);

    void syncAdminAuthSessionMetadataToApi(route).then((apiSession) => {
      if (!apiSession) {
        return;
      }

      updateSession(normalizeSession(apiSession));
    });
  };

  return {
    activeAdmin,
    adminStaff,
    hasHydrated: hasHydratedSession && (!session.isAuthenticated || hasHydratedDirectory),
    isAuthenticated: session.isAuthenticated,
    login,
    logout,
    session,
    setLastVisitedRoute,
  };
};
