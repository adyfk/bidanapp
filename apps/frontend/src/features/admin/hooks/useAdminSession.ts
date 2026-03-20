'use client';

import { useEffect, useState } from 'react';
import { MOCK_ADMIN_STAFF } from '@/lib/mock-db/admin';
import type { AdminSessionState, AdminStaffMember } from '@/types/admin';

export const ADMIN_DEMO_PASSWORD = 'Admin123!';

const adminSessionStorageKey = 'bidanapp:admin-session';
const adminSessionEventName = 'bidanapp:admin-session-change';

const defaultAdminSession: AdminSessionState = {
  adminId: '',
  email: '',
  focusArea: 'support',
  isAuthenticated: false,
};

const buildLoggedOutSession = (value?: Partial<AdminSessionState>): AdminSessionState => ({
  adminId: '',
  email: '',
  focusArea: value?.focusArea || 'support',
  isAuthenticated: false,
  lastLoginAt: value?.lastLoginAt,
  lastVisitedRoute: value?.lastVisitedRoute,
});

const readAdminSession = (): AdminSessionState => {
  if (typeof window === 'undefined') {
    return defaultAdminSession;
  }

  try {
    const storedValue = window.localStorage.getItem(adminSessionStorageKey);

    if (!storedValue) {
      return defaultAdminSession;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<AdminSessionState>;

    if (!parsedValue.isAuthenticated || !parsedValue.adminId || !parsedValue.email) {
      return buildLoggedOutSession(parsedValue);
    }

    return {
      adminId: parsedValue.adminId,
      email: parsedValue.email,
      focusArea: parsedValue.focusArea || 'support',
      isAuthenticated: true,
      lastLoginAt: parsedValue.lastLoginAt,
      lastVisitedRoute: parsedValue.lastVisitedRoute,
    };
  } catch {
    return defaultAdminSession;
  }
};

const persistAdminSession = (nextSession: AdminSessionState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(adminSessionStorageKey, JSON.stringify(nextSession));
  window.dispatchEvent(new Event(adminSessionEventName));
};

export const useAdminSession = () => {
  const [session, setSession] = useState<AdminSessionState>(defaultAdminSession);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSession = () => {
      setSession(readAdminSession());
    };

    syncSession();
    setHasHydrated(true);
    window.addEventListener('storage', syncSession);
    window.addEventListener(adminSessionEventName, syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener(adminSessionEventName, syncSession);
    };
  }, []);

  const activeAdmin =
    MOCK_ADMIN_STAFF.find((admin) => admin.id === session.adminId || admin.email === session.email) || null;

  const updateSession = (nextSession: AdminSessionState) => {
    setSession(nextSession);
    persistAdminSession(nextSession);
  };

  const login = ({ admin, email, password }: { admin: AdminStaffMember; email: string; password: string }) => {
    if (password !== ADMIN_DEMO_PASSWORD || email.trim().toLowerCase() !== admin.email.toLowerCase()) {
      return false;
    }

    updateSession({
      adminId: admin.id,
      email: admin.email,
      focusArea: admin.focusArea,
      isAuthenticated: true,
      lastLoginAt: new Date().toISOString(),
      lastVisitedRoute: session.lastVisitedRoute,
    });

    return true;
  };

  const logout = () => {
    updateSession(
      buildLoggedOutSession({
        focusArea: session.focusArea,
        lastLoginAt: session.lastLoginAt,
        lastVisitedRoute: session.lastVisitedRoute,
      }),
    );
  };

  const switchAdminPersona = (adminId: string) => {
    const nextAdmin = MOCK_ADMIN_STAFF.find((admin) => admin.id === adminId);

    if (!nextAdmin || !session.isAuthenticated) {
      return false;
    }

    updateSession({
      ...session,
      adminId: nextAdmin.id,
      email: nextAdmin.email,
      focusArea: nextAdmin.focusArea,
    });

    return true;
  };

  const setLastVisitedRoute = (route: string) => {
    if (!session.isAuthenticated || session.lastVisitedRoute === route) {
      return;
    }

    updateSession({
      ...session,
      lastVisitedRoute: route,
    });
  };

  return {
    activeAdmin,
    adminStaff: MOCK_ADMIN_STAFF,
    hasHydrated,
    isAuthenticated: session.isAuthenticated,
    login,
    logout,
    session,
    setLastVisitedRoute,
    switchAdminPersona,
  };
};
