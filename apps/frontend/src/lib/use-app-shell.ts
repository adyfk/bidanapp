'use client';

import { useEffect, useState } from 'react';
import { hydrateCustomerAuthSessionFromApi } from '@/lib/customer-auth-api';
import { hasCustomerAuthSessionHint, subscribeCustomerAuthSessionHint } from '@/lib/customer-auth-storage';
import {
  buildEmptyPublicBootstrapData,
  fetchPublicBootstrapData,
  type PublicBootstrapData,
} from '@/lib/public-bootstrap-source';
import { readCachedCustomerAuthSession, subscribeCustomerAuthSession } from '@/lib/use-customer-auth-session';
import type { CustomerAuthSessionState } from '@/types/customer-auth';

const appShellChangeEventName = 'bidanapp:app-shell-change';
let cachedBootstrap = buildEmptyPublicBootstrapData();
let hydrateBootstrapPromise: Promise<PublicBootstrapData | null> | null = null;

const readAuthenticatedConsumerOverlay = (): Pick<
  CustomerAuthSessionState,
  'consumerId' | 'displayName' | 'phone'
> | null => {
  if (typeof window === 'undefined' || !hasCustomerAuthSessionHint()) {
    return null;
  }

  const cachedSession = readCachedCustomerAuthSession() as Partial<CustomerAuthSessionState>;
  if (!cachedSession.isAuthenticated || !cachedSession.consumerId || !cachedSession.phone) {
    return null;
  }

  return {
    consumerId: cachedSession.consumerId,
    displayName: cachedSession.displayName || '',
    phone: cachedSession.phone,
  };
};

const withCustomerOverlay = (
  bootstrap: PublicBootstrapData,
  customerOverlay: Pick<
    CustomerAuthSessionState,
    'consumerId' | 'displayName' | 'phone'
  > | null = readAuthenticatedConsumerOverlay(),
): PublicBootstrapData => {
  if (!customerOverlay) {
    return bootstrap;
  }

  const currentConsumer = {
    ...bootstrap.currentConsumer,
    id: customerOverlay.consumerId,
    name: customerOverlay.displayName || bootstrap.currentConsumer.name,
    phone: customerOverlay.phone || bootstrap.currentConsumer.phone,
  };

  return {
    ...bootstrap,
    activeHomeFeed: {
      ...bootstrap.activeHomeFeed,
      currentUser: {
        ...bootstrap.activeHomeFeed.currentUser,
        ...currentConsumer,
      },
    },
    currentConsumer,
  };
};

const writeCachedBootstrap = (nextBootstrap: PublicBootstrapData) => {
  cachedBootstrap = nextBootstrap;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(appShellChangeEventName));
  }
};

const hydrateAppShellFromApi = async (): Promise<PublicBootstrapData | null> => {
  if (hydrateBootstrapPromise) {
    return hydrateBootstrapPromise;
  }

  hydrateBootstrapPromise = fetchPublicBootstrapData()
    .then((nextBootstrap) => {
      writeCachedBootstrap(nextBootstrap);
      return nextBootstrap;
    })
    .catch(() => null)
    .finally(() => {
      hydrateBootstrapPromise = null;
    });

  return hydrateBootstrapPromise;
};

export const useAppShell = () => {
  const [customerOverlay, setCustomerOverlay] = useState<Pick<
    CustomerAuthSessionState,
    'consumerId' | 'displayName' | 'phone'
  > | null>(() => readAuthenticatedConsumerOverlay());
  const [bootstrap, setBootstrap] = useState<PublicBootstrapData>(() =>
    withCustomerOverlay(cachedBootstrap, customerOverlay),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncBootstrap = () => {
      const nextCustomerOverlay = readAuthenticatedConsumerOverlay();
      setCustomerOverlay(nextCustomerOverlay);
      setBootstrap(withCustomerOverlay(cachedBootstrap, nextCustomerOverlay));
    };

    syncBootstrap();
    window.addEventListener(appShellChangeEventName, syncBootstrap);
    const unsubscribeCustomerSession = subscribeCustomerAuthSession(syncBootstrap);
    const unsubscribeCustomerAuth = subscribeCustomerAuthSessionHint(syncBootstrap);

    void Promise.all([hydrateAppShellFromApi(), hydrateCustomerAuthSessionFromApi()]).then(
      ([nextBootstrap, authenticatedCustomerSession]) => {
        const nextCustomerOverlay = authenticatedCustomerSession?.isAuthenticated
          ? {
              consumerId: authenticatedCustomerSession.consumerId,
              displayName: authenticatedCustomerSession.displayName || '',
              phone: authenticatedCustomerSession.phone,
            }
          : readAuthenticatedConsumerOverlay();

        setCustomerOverlay(nextCustomerOverlay);

        if (nextBootstrap) {
          setBootstrap(withCustomerOverlay(nextBootstrap, nextCustomerOverlay));
          return;
        }

        setBootstrap(withCustomerOverlay(cachedBootstrap, nextCustomerOverlay));
      },
    );

    return () => {
      window.removeEventListener(appShellChangeEventName, syncBootstrap);
      unsubscribeCustomerSession();
      unsubscribeCustomerAuth();
    };
  }, []);

  return {
    ...bootstrap,
    currentConsumer: withCustomerOverlay(bootstrap, customerOverlay).currentConsumer,
    currentUserContext: bootstrap.currentUserContext,
  };
};
