'use client';

import { useEffect, useState } from 'react';

export type ViewerMode = 'visitor' | 'customer' | 'professional';

interface ViewerSessionState {
  mode: ViewerMode;
}

const viewerSessionStorageKey = 'bidanapp:viewer-session';
const viewerSessionEventName = 'bidanapp:viewer-session-change';
const defaultViewerSession: ViewerSessionState = {
  mode: 'visitor',
};

const readViewerSession = (): ViewerSessionState => {
  if (typeof window === 'undefined') {
    return defaultViewerSession;
  }

  try {
    const storedValue = window.localStorage.getItem(viewerSessionStorageKey);

    if (!storedValue) {
      return defaultViewerSession;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<ViewerSessionState>;

    if (parsedValue.mode === 'visitor' || parsedValue.mode === 'customer' || parsedValue.mode === 'professional') {
      return {
        mode: parsedValue.mode,
      };
    }

    return defaultViewerSession;
  } catch {
    return defaultViewerSession;
  }
};

const persistViewerSession = (nextState: ViewerSessionState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(viewerSessionStorageKey, JSON.stringify(nextState));
  window.dispatchEvent(new Event(viewerSessionEventName));
};

export const useViewerSession = () => {
  const [viewerSession, setViewerSession] = useState<ViewerSessionState>(defaultViewerSession);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncViewerSession = () => {
      setViewerSession(readViewerSession());
    };

    syncViewerSession();
    window.addEventListener('storage', syncViewerSession);
    window.addEventListener(viewerSessionEventName, syncViewerSession);

    return () => {
      window.removeEventListener('storage', syncViewerSession);
      window.removeEventListener(viewerSessionEventName, syncViewerSession);
    };
  }, []);

  const updateViewerMode = (mode: ViewerMode) => {
    const nextState = {
      mode,
    } satisfies ViewerSessionState;

    setViewerSession(nextState);
    persistViewerSession(nextState);
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
