'use client';

import { useEffect, useRef, useState } from 'react';
import { hydrateViewerSessionFromApi, syncViewerSessionToApi } from '@/lib/app-state-api';
import { hydrateCustomerAuthSessionFromApi } from '@/lib/customer-auth-api';
import { hasCustomerAuthSessionHint, subscribeCustomerAuthSessionHint } from '@/lib/customer-auth-storage';
import { hydrateProfessionalAuthSessionFromApi } from '@/lib/professional-auth-api';
import { hasProfessionalAuthSessionHint, subscribeProfessionalAuthSessionHint } from '@/lib/professional-auth-storage';

export type ViewerMode = 'visitor' | 'customer' | 'professional';

interface ViewerSessionState {
  mode: ViewerMode;
}

const viewerSessionEventName = 'bidanapp:viewer-session-change';
const defaultViewerSession: ViewerSessionState = {
  mode: 'visitor',
};
let cachedViewerSession = defaultViewerSession;

const normalizeViewerSession = (mode: unknown): ViewerSessionState => {
  if (mode === 'customer') {
    return hasCustomerAuthSessionHint() ? { mode } : defaultViewerSession;
  }

  if (mode === 'professional') {
    return hasProfessionalAuthSessionHint() ? { mode } : defaultViewerSession;
  }

  return mode === 'visitor' ? { mode } : defaultViewerSession;
};

const readViewerSession = (): ViewerSessionState => normalizeViewerSession(cachedViewerSession.mode);

const writeViewerSession = (nextState: ViewerSessionState) => {
  cachedViewerSession = normalizeViewerSession(nextState.mode);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(viewerSessionEventName));
};

const persistViewerSession = (nextState: ViewerSessionState, syncBackend: boolean) => {
  writeViewerSession(nextState);

  if (syncBackend) {
    syncViewerSessionToApi(nextState);
  }
};

export const useViewerSession = () => {
  const [viewerSession, setViewerSession] = useState<ViewerSessionState>(() => readViewerSession());
  const hasLoadedBackendRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncViewerSession = () => {
      const nextViewerSession = readViewerSession();
      setViewerSession(nextViewerSession);

      if (nextViewerSession.mode !== cachedViewerSession.mode) {
        writeViewerSession(nextViewerSession);
      }
    };

    syncViewerSession();
    window.addEventListener(viewerSessionEventName, syncViewerSession);
    const unsubscribeCustomerAuth = subscribeCustomerAuthSessionHint(syncViewerSession);
    const unsubscribeProfessionalAuth = subscribeProfessionalAuthSessionHint(syncViewerSession);

    void Promise.all([
      hydrateViewerSessionFromApi(),
      hydrateCustomerAuthSessionFromApi(),
      hydrateProfessionalAuthSessionFromApi(),
    ])
      .then(([apiState, customerSession, professionalSession]) => {
        const nextMode = professionalSession?.isAuthenticated
          ? 'professional'
          : customerSession?.isAuthenticated
            ? 'customer'
            : (apiState?.mode ?? 'visitor');
        const nextState = normalizeViewerSession(nextMode);

        setViewerSession(nextState);
        writeViewerSession(nextState);
      })
      .finally(() => {
        hasLoadedBackendRef.current = true;
      });

    return () => {
      window.removeEventListener(viewerSessionEventName, syncViewerSession);
      unsubscribeCustomerAuth();
      unsubscribeProfessionalAuth();
    };
  }, []);

  const updateViewerMode = (mode: ViewerMode) => {
    const nextState = {
      mode,
    } satisfies ViewerSessionState;

    setViewerSession(nextState);
    persistViewerSession(nextState, hasLoadedBackendRef.current);
  };

  return {
    continueAsCustomer: () => updateViewerMode('customer'),
    continueAsProfessional: () => updateViewerMode('professional'),
    continueAsVisitor: () => updateViewerMode('visitor'),
    isCustomer: viewerSession.mode === 'customer',
    isProfessional: viewerSession.mode === 'professional',
    isVisitor: viewerSession.mode === 'visitor',
    viewerMode: viewerSession.mode,
  };
};
